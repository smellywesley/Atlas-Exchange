import { NextResponse } from "next/server";
import { buildLondonPlanResponse } from "@/lib/plan-engine";
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

  const response = buildLondonPlanResponse(parsed.data);

  return NextResponse.json(response);
}
