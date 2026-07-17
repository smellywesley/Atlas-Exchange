import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { exchangeCountries } from "./exchange-map-data";

export const universityNameSchema = z.string().trim().min(1).max(160);

export const compareUniversitiesRequestSchema = z.object({
  universityNames: z.array(universityNameSchema).min(1).max(4)
});
export type CompareUniversitiesRequest = z.infer<typeof compareUniversitiesRequestSchema>;

export type CostOfLiving = {
  monthlyEstimateLocalCurrency: string;
  currency: string;
  housing: string;
  food: string;
  transport: string;
  notes: string;
};

export type WeekendPlans = {
  placesToExplore: string[];
  communities: string[];
};

export type UniversityProfile = {
  universityName: string;
  country: string;
  primaryLanguage: string;
  languageNotes: string;
  costOfLiving: CostOfLiving;
  ccas: string[];
  weekendPlans: WeekendPlans;
  sources: string[];
  researchedAt: string;
  mode: "openai" | "mock";
};

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(DATA_DIR, "universities-cache.json");
const MAX_CACHE_ENTRIES = 300;

function ensureStore(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(CACHE_FILE)) {
    writeFileSync(CACHE_FILE, "{}", "utf-8");
  }
}

function loadCache(): Record<string, UniversityProfile> {
  ensureStore();
  try {
    const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, UniversityProfile>) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, UniversityProfile>): void {
  ensureStore();
  const entries = Object.entries(cache);
  const bounded = entries.length > MAX_CACHE_ENTRIES
    ? Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
    : cache;
  writeFileSync(CACHE_FILE, JSON.stringify(bounded, null, 2), "utf-8");
}

function cacheKey(name: string): string {
  return name.trim().toLowerCase();
}

export async function getUniversityProfile(
  name: string,
  forceRefresh = false
): Promise<UniversityProfile> {
  const cache = loadCache();
  const key = cacheKey(name);

  if (!forceRefresh && cache[key]) {
    return cache[key];
  }

  const profile = await researchUniversity(name);
  cache[key] = profile;
  saveCache(cache);
  return profile;
}

export async function compareUniversities(names: string[]): Promise<UniversityProfile[]> {
  // Sequential, not Promise.all: each lookup does a read-modify-write of the
  // shared cache file, so concurrent writes would clobber each other and
  // silently drop entries.
  const profiles: UniversityProfile[] = [];
  for (const name of names) {
    profiles.push(await getUniversityProfile(name));
  }
  return profiles;
}

async function researchUniversity(universityName: string): Promise<UniversityProfile> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      return await researchWithOpenAi(universityName, apiKey);
    } catch (error) {
      console.error(
        "University research via OpenAI failed",
        error instanceof Error ? error.name : "UnknownError"
      );
    }
  }

  return buildMockProfile(universityName);
}

const PROMPT_TEMPLATE = (universityName: string) => `You are researching a partner university for a Singaporean student going on \
exchange to "${universityName}". Use web search to find current, accurate information.

Return ONLY a single JSON object (no markdown fences, no commentary) matching this shape:
{
  "university_name": "${universityName}",
  "country": "<country the university is in>",
  "primary_language": "<main local language>",
  "language_notes": "<how easily an English-speaking exchange student can get by, 1-2 sentences>",
  "cost_of_living": {
    "monthly_estimate_local_currency": "<numeric estimate, e.g. 1200>",
    "currency": "<currency code, e.g. EUR>",
    "housing": "<typical monthly housing cost/range>",
    "food": "<typical monthly food cost/range>",
    "transport": "<typical monthly transport cost/range>",
    "notes": "<other relevant cost notes>"
  },
  "ccas": ["<student clubs / CCAs / extracurricular activities available at this university>", "..."],
  "weekend_plans": {
    "places_to_explore": ["<notable nearby cities/attractions for weekend trips>", "..."],
    "communities": ["<student communities, exchange student groups, or expat/international communities to join>", "..."]
  },
  "sources": ["<URL>", "..."]
}

Keep lists to at most 6 items each. If something can't be found, use an empty string or empty list \
rather than guessing wildly.`;

type OpenAiResponseEnvelope = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function extractOutputText(payload: OpenAiResponseEnvelope): string {
  // The raw REST response has no top-level `output_text` — that field is a
  // convenience getter the official SDKs synthesize. The real text is nested
  // in output[].content[].text on "message" items (web_search_call items
  // that precede it carry no text).
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    if (item.type !== "message") {
      continue;
    }
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}

type OpenAiResponsePayload = {
  university_name?: unknown;
  country?: unknown;
  primary_language?: unknown;
  language_notes?: unknown;
  cost_of_living?: {
    monthly_estimate_local_currency?: unknown;
    currency?: unknown;
    housing?: unknown;
    food?: unknown;
    transport?: unknown;
    notes?: unknown;
  };
  ccas?: unknown;
  weekend_plans?: {
    places_to_explore?: unknown;
    communities?: unknown;
  };
  sources?: unknown;
};

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item !== null && item !== undefined).map((item) => String(item));
}

function extractJson(text: string): OpenAiResponsePayload {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const source = fenced ? fenced[1] : (trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed);
  return JSON.parse(source) as OpenAiResponsePayload;
}

async function researchWithOpenAi(universityName: string, apiKey: string): Promise<UniversityProfile> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        tools: [{ type: "web_search_preview" }],
        input: PROMPT_TEMPLATE(universityName)
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`OpenAI responses API failed with ${response.status}`);
  }

  const payload = (await response.json()) as OpenAiResponseEnvelope;
  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI responses API returned no message output");
  }

  const data = extractJson(outputText);
  const costOfLiving = data.cost_of_living ?? {};
  const weekendPlans = data.weekend_plans ?? {};

  return {
    universityName: asString(data.university_name) || universityName,
    country: asString(data.country),
    primaryLanguage: asString(data.primary_language),
    languageNotes: asString(data.language_notes),
    costOfLiving: {
      monthlyEstimateLocalCurrency: asString(costOfLiving.monthly_estimate_local_currency),
      currency: asString(costOfLiving.currency),
      housing: asString(costOfLiving.housing),
      food: asString(costOfLiving.food),
      transport: asString(costOfLiving.transport),
      notes: asString(costOfLiving.notes)
    },
    ccas: asStringList(data.ccas),
    weekendPlans: {
      placesToExplore: asStringList(weekendPlans.places_to_explore),
      communities: asStringList(weekendPlans.communities)
    },
    sources: asStringList(data.sources),
    researchedAt: new Date().toISOString(),
    mode: "openai"
  };
}

function buildMockProfile(universityName: string): UniversityProfile {
  const match = exchangeCountries
    .flatMap((country) => country.universities.map((university) => ({ country, university })))
    .find(({ university }) => university.name.toLowerCase() === universityName.trim().toLowerCase());

  return {
    universityName,
    country: match?.country.name ?? "",
    primaryLanguage: "",
    languageNotes: "OPENAI_API_KEY is missing, so this profile is a deterministic placeholder rather than researched content.",
    costOfLiving: {
      monthlyEstimateLocalCurrency: "",
      currency: "",
      housing: "",
      food: "",
      transport: "",
      notes: "Add OPENAI_API_KEY to enable live cost-of-living research for this university."
    },
    ccas: [],
    weekendPlans: {
      placesToExplore: match ? [`Explore ${match.country.name} beyond ${match.university.city}`] : [],
      communities: []
    },
    sources: match?.university.sourceUrl ? [match.university.sourceUrl] : [],
    researchedAt: new Date().toISOString(),
    mode: "mock"
  };
}
