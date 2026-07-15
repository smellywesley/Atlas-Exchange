import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

const MAX_CACHE_TTL_MS = 15 * 60_000;
const DEFAULT_MAX_CACHE_ENTRIES = 200;

export const qnaTopicSchema = z.enum([
  "visa",
  "modules",
  "culture",
  "accommodation",
  "budget",
  "packing",
  "deadlines",
  "local-life",
  "general"
]);

const qnaEvidenceSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9._:-]+$/),
  topic: qnaTopicSchema,
  text: z.string().trim().min(1).max(600),
  sourceRefIds: z
    .array(z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._:-]+$/))
    .max(8)
    .default([])
});

export const qnaRequestSchema = z
  .object({
    question: z.string().trim().min(3).max(240),
    context: z.object({
      classification: z.literal("non-pii"),
      evidence: z.array(qnaEvidenceSchema).max(40)
    })
  })
  .superRefine((value, context) => {
    const strings = [value.question, ...value.context.evidence.map((item) => item.text)];
    if (strings.some(containsLikelyPii)) {
      context.addIssue({
        code: "custom",
        path: ["context"],
        message: "Q&A accepts non-PII context only; remove personal identifiers."
      });
    }
  });

export type QnaRequest = z.infer<typeof qnaRequestSchema>;
export type QnaTopic = z.infer<typeof qnaTopicSchema>;

export type DeterministicAnswer = {
  topic: QnaTopic;
  answer: string;
  support: "supplied-context" | "unsupported";
  evidenceIds: string[];
  sourceRefIds: string[];
  cacheStatus: "hit" | "miss";
};

type QnaEngineOptions = {
  now?: () => number;
  ttlMs?: number;
  maxCacheEntries?: number;
};

type CacheEntry = {
  answer: Omit<DeterministicAnswer, "cacheStatus">;
  expiresAt: number;
};

const topicKeywords: Readonly<Record<Exclude<QnaTopic, "general">, readonly string[]>> = {
  visa: ["visa", "passport", "immigration", "permit", "entry", "eta"],
  modules: ["module", "course", "credit", "academic", "class", "syllabus", "mapping"],
  culture: ["culture", "etiquette", "custom", "language", "social", "behave"],
  accommodation: ["accommodation", "housing", "rent", "room", "lease", "landlord"],
  budget: ["budget", "cost", "money", "expense", "afford", "price"],
  packing: ["pack", "bring", "luggage", "clothes", "adapter"],
  deadlines: ["deadline", "due", "when", "date", "submit"],
  "local-life": ["transport", "food", "grocery", "weekend", "local", "community"]
};

function inferTopic(question: string): QnaTopic {
  const normalized = question.toLowerCase();
  let selected: QnaTopic = "general";
  let selectedScore = 0;

  for (const [topic, keywords] of Object.entries(topicKeywords) as Array<
    [Exclude<QnaTopic, "general">, readonly string[]]
  >) {
    const score = keywords.reduce(
      (total, keyword) => total + (containsKeyword(normalized, keyword) ? 1 : 0),
      0
    );
    if (score > selectedScore) {
      selected = topic;
      selectedScore = score;
    }
  }

  return selected;
}

function containsKeyword(value: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(value);
}

function buildAnswer(request: QnaRequest): Omit<DeterministicAnswer, "cacheStatus"> {
  const topic = inferTopic(request.question);
  const evidence = request.context.evidence
    .filter((item) => item.topic === topic)
    .slice(0, 3);

  if (evidence.length === 0) {
    return {
      topic,
      answer: `The supplied context does not contain supported evidence for this ${topic} question. Check the relevant official source or add validated context.`,
      support: "unsupported",
      evidenceIds: [],
      sourceRefIds: []
    };
  }

  return {
    topic,
    answer: `Based only on the supplied context: ${evidence.map((item) => item.text).join(" ")}`,
    support: "supplied-context",
    evidenceIds: evidence.map((item) => item.id),
    sourceRefIds: [...new Set(evidence.flatMap((item) => item.sourceRefIds))]
  };
}

export function createQnaEngine(options: QnaEngineOptions = {}) {
  const now = options.now ?? Date.now;
  const ttlMs = Math.min(
    MAX_CACHE_TTL_MS,
    Math.max(1_000, Math.floor(options.ttlMs ?? MAX_CACHE_TTL_MS))
  );
  const maxCacheEntries = Math.min(
    300,
    Math.max(1, Math.floor(options.maxCacheEntries ?? DEFAULT_MAX_CACHE_ENTRIES))
  );
  const cache = new Map<string, CacheEntry>();

  function prune(checkedAt: number) {
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= checkedAt) cache.delete(key);
    }
  }

  function makeRoomForInsert() {
    while (cache.size >= maxCacheEntries) {
      const oldestKey = cache.keys().next().value as string | undefined;
      if (!oldestKey) break;
      cache.delete(oldestKey);
    }
  }

  return {
    answer(input: unknown): DeterministicAnswer {
      const request = qnaRequestSchema.parse(input);
      const checkedAt = now();
      prune(checkedAt);
      const key = createHash("sha256").update(JSON.stringify(request)).digest("hex");
      const cached = cache.get(key);

      if (cached && cached.expiresAt > checkedAt) {
        cache.delete(key);
        cache.set(key, cached);
        return { ...cached.answer, cacheStatus: "hit" };
      }

      const answer = buildAnswer(request);
      prune(checkedAt);
      cache.delete(key);
      makeRoomForInsert();
      cache.set(key, { answer, expiresAt: checkedAt + ttlMs });
      return { ...answer, cacheStatus: "miss" };
    }
  };
}

const defaultQnaEngine = createQnaEngine();

export function answerQuestion(input: unknown) {
  return defaultQnaEngine.answer(input);
}

function containsLikelyPii(value: string) {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const labeledIdentifier =
    /\b(?:passport|student|national|identity|id)\s*(?:number|no\.?|id)?\s*[:#-]\s*[a-z0-9-]{4,}\b/i;
  const phone = /(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]){6,}\d/;
  return email.test(value) || labeledIdentifier.test(value) || phone.test(value);
}
