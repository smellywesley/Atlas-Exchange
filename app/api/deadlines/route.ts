import { NextResponse } from "next/server";
import {
  createDeadline,
  DeadlineCapacityError,
  listDeadlines,
  personalDeadlineCreateSchema
} from "@/lib/deadline-store";
import {
  NO_STORE_HEADERS,
  readBoundedJson,
  takeGlobalRateLimit,
  takeTrustedClientRateLimit
} from "@/lib/request-guard";

export const runtime = "nodejs";

export function GET() {
  const limit = takeGlobalRateLimit("route:deadlines-list", 300, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  return NextResponse.json(listDeadlines(), { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const bodyResult = await readBoundedJson(request, 8_192);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status, headers: NO_STORE_HEADERS });
  }
  const parsed = personalDeadlineCreateSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid deadline", issues: parsed.error.flatten() },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const globalLimit = takeGlobalRateLimit("route:deadlines-write", 120, 60 * 1000);
  const clientLimit = takeTrustedClientRateLimit(request, "deadlines-write-client", 30, 60 * 1000);
  if (!globalLimit.allowed || !clientLimit.allowed) {
    const retryAfter = Math.max(globalLimit.retryAfterSeconds, clientLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const deadline = createDeadline(parsed.data);
    return NextResponse.json(deadline, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof DeadlineCapacityError) {
      return NextResponse.json({ error: error.message }, { status: 507, headers: NO_STORE_HEADERS });
    }
    console.error("Deadline creation failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { error: "The deadline could not be created." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
