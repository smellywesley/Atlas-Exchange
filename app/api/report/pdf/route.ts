import { buildPlanResponseForInput, DestinationResolutionError } from "@/lib/plan-engine";
import { renderPlanPdf } from "@/lib/report-pdf";
import { exchangeProfileInputSchema } from "@/lib/schema";
import { readBoundedJson, requestClientKey, takeRateLimit } from "@/lib/request-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = takeRateLimit(`pdf:${requestClientKey(request)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many PDF requests. Try again after the cooldown." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }
  const bodyResult = await readBoundedJson(request);
  if (!bodyResult.ok) {
    return Response.json({ error: bodyResult.error }, { status: bodyResult.status });
  }
  const body = bodyResult.value;
  if (!body || typeof body !== "object" || !("profile" in body)) {
    return Response.json({ error: "Invalid report request." }, { status: 400 });
  }
  const parsed = exchangeProfileInputSchema.safeParse(body.profile);

  if (!parsed.success) {
    return Response.json({ error: "Invalid report profile", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { plan } = buildPlanResponseForInput(parsed.data);
    const pdf = await renderPlanPdf(plan);
    const filename = `${slugify(plan.partnerUniversity.name)}-exchange-plan.pdf`;

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof DestinationResolutionError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    console.error("Report PDF failed", error);
    return Response.json({ error: "The PDF report could not be generated." }, { status: 500 });
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
