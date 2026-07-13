import { NextResponse } from "next/server";
import { buildPlanResponseForInput, DestinationResolutionError } from "@/lib/plan-engine";
import { exchangeProfileInputSchema } from "@/lib/schema";
import { readBoundedJson } from "@/lib/request-guard";

export async function POST(request: Request) {
  const bodyResult = await readBoundedJson(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
  }
  const parsed = exchangeProfileInputSchema.safeParse(bodyResult.value);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid exchange profile",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    const response = buildPlanResponseForInput(parsed.data);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof DestinationResolutionError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
