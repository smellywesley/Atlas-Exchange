import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/provider-status";
import { NO_STORE_HEADERS, takeGlobalRateLimit } from "@/lib/request-guard";

export function GET() {
  const limit = takeGlobalRateLimit("route:status", 300, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many status requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  return NextResponse.json(getProviderStatus(), { headers: NO_STORE_HEADERS });
}
