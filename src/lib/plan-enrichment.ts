import "server-only";

import { lookupNusModule, NusModsError } from "./academic-modules";
import type { PlanResponse, SourceRef } from "./schema";

export async function enrichPlanWithLiveAcademicData(
  response: PlanResponse
): Promise<PlanResponse> {
  const { academics } = response.plan;
  if (!academics.academicYear || academics.modules.length === 0) return response;

  const enrichModule = async (module: (typeof academics.modules)[number]) => {
      try {
        const result = await lookupNusModule({
          academicYear: academics.academicYear,
          moduleCode: module.moduleCode
        });
        return {
          item: {
            moduleCode: result.candidate.moduleCode,
            academicYear: result.candidate.academicYear,
            title: result.candidate.title,
            moduleCredit: result.candidate.moduleCredit,
            semesters: result.candidate.semesters,
            mappingStatus: "candidate-only" as const,
            approvalRequired: true as const,
            lookupStatus: result.cacheStatus === "stale" ? "stale" as const : "live" as const,
            sourceUrl: result.candidate.source.url,
            warning: result.warnings[0]
          },
          source: {
            id: `nusmods-${result.candidate.academicYear}-${result.candidate.moduleCode}`.toLowerCase(),
            title: `${result.candidate.moduleCode}: ${result.candidate.title}`,
            url: result.candidate.source.url,
            provider: "NUSMods",
            fetchedAt: result.candidate.source.fetchedAt,
            confidence: "high" as const,
            snippet: "Live NUS module record; mapping remains candidate-only."
          } satisfies SourceRef
        };
      } catch (error) {
        const warning = error instanceof NusModsError
          ? error.message
          : "NUSMods lookup was unavailable.";
        return {
          item: { ...module, lookupStatus: "unavailable" as const, warning }
        };
      }
  };
  const enriched: Awaited<ReturnType<typeof enrichModule>>[] = [];
  for (let index = 0; index < academics.modules.length; index += 2) {
    enriched.push(...await Promise.all(academics.modules.slice(index, index + 2).map(enrichModule)));
  }

  return {
    ...response,
    plan: {
      ...response.plan,
      academics: { ...academics, modules: enriched.map(({ item }) => item) },
      sources: [
        ...response.plan.sources,
        ...enriched.flatMap(({ source }) => source ? [source] : [])
      ]
    }
  };
}
