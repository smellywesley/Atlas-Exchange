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
  const warnings = [
    "Deterministic planning is active. Accommodation results use live platform links plus seeded ranking."
  ];

  return {
    mode: "mock",
    planner: "deterministic",
    search: "live-link",
    costControl: {
      llmCallsPerSubmit: 0,
      maxSourceSnippets: readNumberEnv("MAX_SOURCE_SNIPPETS", 6),
      maxOutputTokens: readNumberEnv("MAX_OUTPUT_TOKENS", 1800),
      cacheRecommended: true
    },
    warnings
  };
}
