import { NextResponse } from "next/server";
import { getTimeline } from "@/lib/deadline-store";
import { NO_STORE_HEADERS, takeGlobalRateLimit } from "@/lib/request-guard";

export const runtime = "nodejs";

export function GET() {
  const limit = takeGlobalRateLimit("route:deadlines-timeline", 300, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  return NextResponse.json(getTimeline(), { headers: NO_STORE_HEADERS });
}
