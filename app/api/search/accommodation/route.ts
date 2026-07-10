import { NextResponse } from "next/server";
import { londonPartners } from "@/lib/demo-data";
import { searchLondonAccommodation } from "@/lib/search-provider";

export async function GET(request: Request) {
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

  return NextResponse.json(result);
}
