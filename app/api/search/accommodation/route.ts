import { NextResponse } from "next/server";
import { londonPartners } from "@/lib/demo-data";
import { NO_STORE_HEADERS, takeGlobalRateLimit } from "@/lib/request-guard";
import { searchLondonAccommodation } from "@/lib/search-provider";

export async function GET(request: Request) {
  const limit = takeGlobalRateLimit("route:accommodation-search", 180, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many accommodation searches. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const url = new URL(request.url);
  const budgetSgd = Number(url.searchParams.get("budgetSgd") ?? "2300");
  const housingPreference = url.searchParams.get("housingPreference") ?? "shared";
  const partnerUniversityId = url.searchParams.get("partnerUniversityId") ?? "ucl";
  const partnerUniversity =
    londonPartners.find((partner) => partner.id === partnerUniversityId) ??
    londonPartners[0];

  const result = searchLondonAccommodation({
    monthlyBudgetSgd: Number.isFinite(budgetSgd) ? budgetSgd : 2300,
    housingPreference,
    partnerUniversity
  });

  return NextResponse.json(result, { headers: NO_STORE_HEADERS });
}
