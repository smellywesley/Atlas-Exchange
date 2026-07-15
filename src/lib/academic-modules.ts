import "server-only";

import { z } from "zod";

import { academicYearSchema } from "./academic-year";

const NUSMODS_ORIGIN = "https://api.nusmods.com";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_FRESH_TTL_MS = 5 * 60_000;
const DEFAULT_STALE_TTL_MS = 24 * 60 * 60_000;
const DEFAULT_MAX_CACHE_ENTRIES = 128;
const DEFAULT_MAX_CONCURRENT_FETCHES = 8;
const DEFAULT_MAX_FETCHES_PER_WINDOW = 120;
const DEFAULT_FETCH_WINDOW_MS = 60_000;

const moduleCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .min(3)
      .max(16)
      .regex(
        /^[A-Z]{1,8}\d{1,6}[A-Z0-9]{0,6}$/,
        "Module code must contain only a valid NUS module-code shape."
      )
  );

export const nusModsLookupSchema = z.object({
  academicYear: academicYearSchema,
  moduleCode: moduleCodeSchema
});

const nusModsModuleSchema = z.object({
  moduleCode: moduleCodeSchema,
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(10_000).optional(),
  department: z.string().trim().max(500).optional(),
  faculty: z.string().trim().max(500).optional(),
  moduleCredit: z.string().trim().max(20).optional(),
  workload: z.array(z.number().finite().nonnegative()).max(8).optional(),
  semesterData: z
    .array(
      z.object({
        semester: z.number().int().min(1).max(4)
      }).passthrough()
    )
    .max(4)
    .optional()
}).passthrough();

export type NusModsLookup = z.infer<typeof nusModsLookupSchema>;

export type AcademicModuleCandidate = {
  academicYear: string;
  moduleCode: string;
  title: string;
  description?: string;
  department?: string;
  faculty?: string;
  moduleCredit?: string;
  workload?: number[];
  semesters: number[];
  mappingStatus: "candidate-only";
  approvalRequired: true;
  source: {
    provider: "NUSMods";
    url: string;
    fetchedAt: string;
  };
};

export type ModuleMappingCandidate = {
  homeModuleCode: string;
  hostModuleCode: string;
  evidenceNotes: string[];
  mappingStatus: "candidate-only";
  approvalRequired: true;
};

const moduleMappingCandidateSchema = z.object({
  homeModuleCode: z.string().trim().min(2).max(32),
  hostModuleCode: z.string().trim().min(2).max(32),
  evidenceNotes: z.array(z.string().trim().min(1).max(500)).max(12).default([])
});

export function createModuleMappingCandidate(
  input: z.input<typeof moduleMappingCandidateSchema>
): ModuleMappingCandidate {
  const parsed = moduleMappingCandidateSchema.parse(input);

  return {
    ...parsed,
    mappingStatus: "candidate-only",
    approvalRequired: true
  };
}

export type NusModsLookupResult = {
  candidate: AcademicModuleCandidate;
  cacheStatus: "miss" | "fresh" | "stale";
  warnings: string[];
};

export class NusModsError extends Error {
  constructor(
    message: string,
    readonly kind: "not-found" | "timeout" | "upstream" | "invalid-response" | "capacity"
  ) {
    super(message);
    this.name = "NusModsError";
  }
}

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Pick<Response, "ok" | "status" | "json">>;

type CacheEntry = {
  candidate: AcademicModuleCandidate;
  freshUntil: number;
  staleUntil: number;
};

type NusModsClientOptions = {
  fetchImpl?: FetchLike;
  now?: () => number;
  timeoutMs?: number;
  freshTtlMs?: number;
  staleTtlMs?: number;
  maxCacheEntries?: number;
  maxConcurrentFetches?: number;
  maxFetchesPerWindow?: number;
  fetchWindowMs?: number;
};

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value as number)));
}

function moduleUrl({ academicYear, moduleCode }: NusModsLookup) {
  const url = new URL(
    `/v2/${encodeURIComponent(academicYear)}/modules/${encodeURIComponent(moduleCode)}.json`,
    NUSMODS_ORIGIN
  );

  if (url.origin !== NUSMODS_ORIGIN) {
    throw new NusModsError("Invalid NUSMods destination.", "upstream");
  }

  return url.toString();
}

export function createNusModsClient(options: NusModsClientOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const timeoutMs = boundedInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 100, 10_000);
  const freshTtlMs = boundedInteger(
    options.freshTtlMs,
    DEFAULT_FRESH_TTL_MS,
    100,
    15 * 60_000
  );
  const staleTtlMs = boundedInteger(
    options.staleTtlMs,
    DEFAULT_STALE_TTL_MS,
    freshTtlMs,
    48 * 60 * 60_000
  );
  const maxCacheEntries = boundedInteger(
    options.maxCacheEntries,
    DEFAULT_MAX_CACHE_ENTRIES,
    1,
    256
  );
  const maxConcurrentFetches = boundedInteger(
    options.maxConcurrentFetches,
    DEFAULT_MAX_CONCURRENT_FETCHES,
    1,
    32
  );
  const maxFetchesPerWindow = boundedInteger(
    options.maxFetchesPerWindow,
    DEFAULT_MAX_FETCHES_PER_WINDOW,
    1,
    1_000
  );
  const fetchWindowMs = boundedInteger(
    options.fetchWindowMs,
    DEFAULT_FETCH_WINDOW_MS,
    1_000,
    15 * 60_000
  );
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<AcademicModuleCandidate>>();
  let activeFetches = 0;
  let fetchesInWindow = 0;
  let fetchWindowStartedAt = now();

  function reserveFetch() {
    const checkedAt = now();
    if (checkedAt - fetchWindowStartedAt >= fetchWindowMs) {
      fetchWindowStartedAt = checkedAt;
      fetchesInWindow = 0;
    }
    if (activeFetches >= maxConcurrentFetches || fetchesInWindow >= maxFetchesPerWindow) {
      throw new NusModsError("NUSMods lookup capacity is temporarily exhausted.", "capacity");
    }

    activeFetches += 1;
    fetchesInWindow += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      activeFetches -= 1;
    };
  }

  function prune(expirationTime: number) {
    for (const [key, entry] of cache) {
      if (entry.staleUntil <= expirationTime) cache.delete(key);
    }
  }

  function makeRoomForInsert() {
    while (cache.size >= maxCacheEntries) {
      const oldestKey = cache.keys().next().value as string | undefined;
      if (!oldestKey) break;
      cache.delete(oldestKey);
    }
  }

  async function fetchCandidate(lookup: NusModsLookup): Promise<AcademicModuleCandidate> {
    const releaseFetch = reserveFetch();
    const url = moduleUrl(lookup);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: controller.signal
      });

      if (response.status === 404) {
        throw new NusModsError("NUSMods module was not found.", "not-found");
      }
      if (!response.ok) {
        throw new NusModsError(`NUSMods returned HTTP ${response.status}.`, "upstream");
      }

      const parsed = nusModsModuleSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new NusModsError("NUSMods returned an invalid module payload.", "invalid-response");
      }

      const fetchedAt = new Date(now()).toISOString();
      return {
        academicYear: lookup.academicYear,
        moduleCode: parsed.data.moduleCode,
        title: parsed.data.title,
        description: parsed.data.description,
        department: parsed.data.department,
        faculty: parsed.data.faculty,
        moduleCredit: parsed.data.moduleCredit,
        workload: parsed.data.workload,
        semesters: [...new Set(parsed.data.semesterData?.map((item) => item.semester) ?? [])]
          .sort((left, right) => left - right),
        mappingStatus: "candidate-only",
        approvalRequired: true,
        source: {
          provider: "NUSMods",
          url,
          fetchedAt
        }
      };
    } catch (error) {
      if (error instanceof NusModsError) throw error;
      if (controller.signal.aborted) {
        throw new NusModsError("NUSMods request timed out.", "timeout");
      }
      throw new NusModsError("NUSMods request failed.", "upstream");
    } finally {
      clearTimeout(timer);
      releaseFetch();
    }
  }

  return {
    async lookup(input: unknown): Promise<NusModsLookupResult> {
      const lookup = nusModsLookupSchema.parse(input);
      const key = `${lookup.academicYear}:${lookup.moduleCode}`;
      const checkedAt = now();
      prune(checkedAt);
      const cached = cache.get(key);

      if (cached && cached.freshUntil > checkedAt) {
        cache.delete(key);
        cache.set(key, cached);
        return { candidate: cached.candidate, cacheStatus: "fresh", warnings: [] };
      }

      try {
        let pending = inFlight.get(key);
        if (!pending) {
          pending = fetchCandidate(lookup).finally(() => inFlight.delete(key));
          inFlight.set(key, pending);
        }
        const candidate = await pending;
        const storedAt = now();
        prune(storedAt);
        cache.delete(key);
        makeRoomForInsert();
        cache.set(key, {
          candidate,
          freshUntil: storedAt + freshTtlMs,
          staleUntil: storedAt + staleTtlMs
        });
        return { candidate, cacheStatus: "miss", warnings: [] };
      } catch (error) {
        if (cached && cached.staleUntil > checkedAt) {
          return {
            candidate: cached.candidate,
            cacheStatus: "stale",
            warnings: ["NUSMods refresh failed; serving bounded stale data for review."]
          };
        }
        throw error;
      }
    }
  };
}

const defaultNusModsClient = createNusModsClient();

export function lookupNusModule(input: unknown) {
  return defaultNusModsClient.lookup(input);
}
