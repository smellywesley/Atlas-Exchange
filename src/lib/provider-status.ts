import type { ProviderStatus } from "./schema";

function readNumberEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function getProviderStatus(): ProviderStatus {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const searchProvider = process.env.SEARCH_PROVIDER ?? "mock";
  const hasLiveSearch =
    searchProvider !== "mock" &&
    (Boolean(process.env.SERPAPI_API_KEY) ||
      Boolean(process.env.TAVILY_API_KEY) ||
      Boolean(process.env.EXA_API_KEY));

  const mode = hasOpenAiKey ? (hasLiveSearch ? "openai" : "hybrid") : "mock";

  const warnings: string[] = [];
  if (!hasOpenAiKey) {
    warnings.push("OPENAI_API_KEY is missing. Deterministic planning is active.");
  }

  if (!hasLiveSearch) {
    warnings.push(
      "Live search API credentials are missing. Accommodation results use live platform links plus seeded ranking."
    );
  }

  return {
    mode,
    planner: hasOpenAiKey ? "openai-ready" : "deterministic",
    search: hasLiveSearch ? "live-api" : "live-link",
    costControl: {
      llmCallsPerSubmit: hasOpenAiKey ? 1 : 0,
      maxSourceSnippets: readNumberEnv("MAX_SOURCE_SNIPPETS", 6),
      maxOutputTokens: readNumberEnv("MAX_OUTPUT_TOKENS", 1800),
      cacheRecommended: true
    },
    warnings
  };
}
