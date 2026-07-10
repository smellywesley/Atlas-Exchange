import { NextResponse } from "next/server";
import { exchangeCountries } from "@/lib/exchange-map-data";
import { buildAtlasPlanResponse, buildLondonPlanResponse } from "@/lib/plan-engine";
import { exchangeProfileInputSchema } from "@/lib/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = exchangeProfileInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid exchange profile",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const country =
    exchangeCountries.find((item) => item.id === parsed.data.countryId) ??
    exchangeCountries.find((item) =>
      item.universities.some((university) => university.name === parsed.data.universityName)
    );

  if (country) {
    const university =
      country.universities.find((item) => item.name === parsed.data.universityName) ??
      country.universities.find((item) => item.name === parsed.data.partnerUniversityId) ??
      country.universities[0];

    const response = buildAtlasPlanResponse(country, university, parsed.data);

    return NextResponse.json(response);
  }

  const response = buildLondonPlanResponse(parsed.data);

  return NextResponse.json(response);
}
