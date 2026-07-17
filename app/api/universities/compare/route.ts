import { NextResponse } from "next/server";
import { compareUniversities, compareUniversitiesRequestSchema } from "@/lib/university-research";
import {
  createConcurrencyGate,
  NO_STORE_HEADERS,
  readBoundedJson,
  takeGlobalRateLimit,
  takeTrustedClientRateLimit
} from "@/lib/request-guard";

export const runtime = "nodejs";

const RESEARCH_WINDOW_MS = 15 * 60 * 1000;
const researchConcurrency = createConcurrencyGate(2);

export async function POST(request: Request) {
  const bodyResult = await readBoundedJson(request, 4_096);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status, headers: NO_STORE_HEADERS });
  }
  const parsed = compareUniversitiesRequestSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid compare request", issues: parsed.error.flatten() },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const globalLimit = takeGlobalRateLimit("route:universities-compare", 40, RESEARCH_WINDOW_MS);
  const clientLimit = takeTrustedClientRateLimit(request, "universities-compare-client", 10, RESEARCH_WINDOW_MS);
  if (!globalLimit.allowed || !clientLimit.allowed) {
    const retryAfter = Math.max(globalLimit.retryAfterSeconds, clientLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many research requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) } }
    );
  }

  const release = researchConcurrency.tryAcquire();
  if (!release) {
    return NextResponse.json(
      { error: "University research is busy. Try again shortly." },
      { status: 503, headers: { ...NO_STORE_HEADERS, "Retry-After": "5" } }
    );
  }

  try {
    const universities = await compareUniversities(parsed.data.universityNames);
    return NextResponse.json({ universities }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("University comparison failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { error: "The university comparison could not be completed." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  } finally {
    release();
  }
}
