import type { ProviderStatus } from "./schema";
import { getReportEmailConfig } from "./report-email-config";

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
    reportDelivery: {
      pdf: "available",
      email: getReportEmailConfig() ? "configured" : "disabled"
    },
    costControl: {
      llmCallsPerSubmit: 0,
      maxSourceSnippets: readNumberEnv("MAX_SOURCE_SNIPPETS", 6),
      maxOutputTokens: readNumberEnv("MAX_OUTPUT_TOKENS", 1800),
      cacheRecommended: true
    },
    warnings
  };
}
