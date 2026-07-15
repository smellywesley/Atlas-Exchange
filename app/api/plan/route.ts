import { NextResponse } from "next/server";
import { buildPlanResponseForInput, DestinationResolutionError } from "@/lib/plan-engine";
import { exchangeProfileInputSchema } from "@/lib/schema";
import { enrichPlanWithLiveAcademicData } from "@/lib/plan-enrichment";
import {
  NO_STORE_HEADERS,
  readBoundedJson,
  takeGlobalRateLimit,
  takeTrustedClientRateLimit
} from "@/lib/request-guard";

export async function POST(request: Request) {
  const bodyResult = await readBoundedJson(request);
  if (!bodyResult.ok) {
    return NextResponse.json(
      { error: bodyResult.error },
      { status: bodyResult.status, headers: NO_STORE_HEADERS }
    );
  }
  const parsed = exchangeProfileInputSchema.safeParse(bodyResult.value);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid exchange profile",
        issues: parsed.error.flatten()
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const limit = takeGlobalRateLimit("route:plan", 240, 60 * 1000);
  const clientLimit = takeTrustedClientRateLimit(request, "plan-client", 30, 60 * 1000);
  if (!limit.allowed || !clientLimit.allowed) {
    const retryAfter = Math.max(limit.retryAfterSeconds, clientLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many plan requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const response = await enrichPlanWithLiveAcademicData(buildPlanResponseForInput(parsed.data));

    return NextResponse.json(response, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof DestinationResolutionError) {
      return NextResponse.json({ error: error.message }, { status: 422, headers: NO_STORE_HEADERS });
    }
    console.error("Plan generation failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { error: "The exchange plan could not be generated." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
