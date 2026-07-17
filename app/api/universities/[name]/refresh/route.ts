import { NextResponse } from "next/server";
import { getUniversityProfile, universityNameSchema } from "@/lib/university-research";
import {
  createConcurrencyGate,
  NO_STORE_HEADERS,
  takeGlobalRateLimit,
  takeTrustedClientRateLimit
} from "@/lib/request-guard";

export const runtime = "nodejs";

const RESEARCH_WINDOW_MS = 15 * 60 * 1000;
const researchConcurrency = createConcurrencyGate(2);

type RouteContext = { params: Promise<{ name: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { name } = await params;
  const parsedName = universityNameSchema.safeParse(decodeURIComponent(name));
  if (!parsedName.success) {
    return NextResponse.json({ error: "Invalid university name." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  // Refresh always calls the paid research provider (no cache short-circuit),
  // so it gets a tighter budget than the cache-first GET lookup.
  const globalLimit = takeGlobalRateLimit("route:universities-refresh", 20, RESEARCH_WINDOW_MS);
  const clientLimit = takeTrustedClientRateLimit(request, "universities-refresh-client", 6, RESEARCH_WINDOW_MS);
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
    const profile = await getUniversityProfile(parsedName.data, true);
    return NextResponse.json(profile, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("University refresh failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { error: "The university profile could not be refreshed." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  } finally {
    release();
  }
}
