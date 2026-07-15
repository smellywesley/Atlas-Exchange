import { buildPlanResponseForInput, DestinationResolutionError } from "@/lib/plan-engine";
import { renderPlanPdf } from "@/lib/report-pdf";
import { exchangeProfileInputSchema } from "@/lib/schema";
import { enrichPlanWithLiveAcademicData } from "@/lib/plan-enrichment";
import {
  createConcurrencyGate,
  NO_STORE_HEADERS,
  readBoundedJson,
  takeGlobalRateLimit,
  takeTrustedClientRateLimit
} from "@/lib/request-guard";

export const runtime = "nodejs";

const PDF_WINDOW_MS = 15 * 60 * 1000;
const pdfConcurrency = createConcurrencyGate(2);

export async function POST(request: Request) {
  const bodyResult = await readBoundedJson(request);
  if (!bodyResult.ok) {
    return jsonNoStore({ error: bodyResult.error }, bodyResult.status);
  }
  const body = bodyResult.value;
  if (!body || typeof body !== "object" || !("profile" in body)) {
    return jsonNoStore({ error: "Invalid report request." }, 400);
  }
  const parsed = exchangeProfileInputSchema.safeParse(body.profile);

  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid report profile", issues: parsed.error.flatten() }, 400);
  }

  const globalLimit = takeGlobalRateLimit("route:pdf", 120, PDF_WINDOW_MS);
  const clientLimit = takeTrustedClientRateLimit(request, "pdf-client", 20, PDF_WINDOW_MS);
  if (!globalLimit.allowed || !clientLimit.allowed) {
    const retryAfter = Math.max(globalLimit.retryAfterSeconds, clientLimit.retryAfterSeconds);
    return Response.json(
      { error: "Too many PDF requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) } }
    );
  }

  const release = pdfConcurrency.tryAcquire();
  if (!release) {
    return Response.json(
      { error: "PDF generation is busy. Try again shortly." },
      { status: 503, headers: { ...NO_STORE_HEADERS, "Retry-After": "5" } }
    );
  }

  try {
    const { plan } = await enrichPlanWithLiveAcademicData(buildPlanResponseForInput(parsed.data));
    const pdf = await renderPlanPdf(plan);
    const filename = `${slugify(plan.partnerUniversity.name)}-exchange-plan.pdf`;

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...NO_STORE_HEADERS
      }
    });
  } catch (error) {
    if (error instanceof DestinationResolutionError) {
      return jsonNoStore({ error: error.message }, 422);
    }
    console.error("Report PDF failed", error);
    return jsonNoStore({ error: "The PDF report could not be generated." }, 500);
  } finally {
    release();
  }
}

function jsonNoStore(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
