import { createHash } from "node:crypto";
import { render } from "react-email";
import { Resend } from "resend";
import { z } from "zod";
import { ExchangePlanEmail } from "@/emails/ExchangePlanEmail";
import { buildPlanResponseForInput, DestinationResolutionError } from "@/lib/plan-engine";
import {
  hasExactRequestOrigin,
  NO_STORE_HEADERS,
  readBoundedJson,
  takeGlobalRateLimit,
  takeRateLimit,
  takeTrustedClientRateLimit,
  validHttpOrigin
} from "@/lib/request-guard";
import { renderPlanPdf } from "@/lib/report-pdf";
import { exchangeProfileInputSchema } from "@/lib/schema";
import { enrichPlanWithLiveAcademicData } from "@/lib/plan-enrichment";

export const runtime = "nodejs";

const emailReportSchema = z.object({ profile: exchangeProfileInputSchema });

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const allowedOrigin = validHttpOrigin(process.env.APP_ORIGIN);
  const allowlist = new Set(
    (process.env.REPORT_EMAIL_ALLOWLIST ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

  if (!apiKey || !from || !allowedOrigin || allowlist.size === 0) {
    return jsonNoStore(
      { error: "Email delivery is not configured", fallback: "Download the PDF report instead." },
      503
    );
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return jsonNoStore({ error: "Cross-site email delivery is not allowed." }, 403);
  }
  if (!hasExactRequestOrigin(request, allowedOrigin)) {
    return jsonNoStore({ error: "Email delivery origin is not allowed." }, 403);
  }

  const bodyResult = await readBoundedJson(request);
  if (!bodyResult.ok) {
    return jsonNoStore({ error: bodyResult.error }, bodyResult.status);
  }
  const parsed = emailReportSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid email report request", issues: parsed.error.flatten() }, 400);
  }

  const studentEmail = parsed.data.profile.studentEmail?.trim();
  if (!studentEmail) {
    return jsonNoStore({ error: "A student email is required." }, 400);
  }

  if (!allowlist.has(studentEmail.toLowerCase())) {
    return jsonNoStore(
      { error: "This student email is not enabled for demo report delivery." },
      403
    );
  }

  let basePlanResponse: ReturnType<typeof buildPlanResponseForInput>;
  try {
    basePlanResponse = buildPlanResponseForInput(parsed.data.profile);
  } catch (error) {
    if (error instanceof DestinationResolutionError) {
      return jsonNoStore({ error: error.message }, 422);
    }
    throw error;
  }

  const globalLimit = takeGlobalRateLimit("route:email", 20, 15 * 60 * 1000);
  if (!globalLimit.allowed) {
    return Response.json(
      { error: "Too many report emails. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(globalLimit.retryAfterSeconds) } }
    );
  }

  const recipientKey = createHash("sha256").update(studentEmail.toLowerCase()).digest("hex");
  const recipientLimit = takeRateLimit(`email-recipient:${recipientKey}`, 3, 24 * 60 * 60 * 1000);
  if (!recipientLimit.allowed) {
    return Response.json(
      { error: "Too many report emails. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(recipientLimit.retryAfterSeconds) } }
    );
  }

  const clientLimit = takeTrustedClientRateLimit(request, "email-client", 3, 15 * 60 * 1000);
  if (!clientLimit.allowed) {
    return Response.json(
      { error: "Too many report emails. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(clientLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { plan } = await enrichPlanWithLiveAcademicData(
      basePlanResponse
    );
    const pdf = await renderPlanPdf(plan);
    const html = await render(ExchangePlanEmail({ plan }));
    const idempotencyKey = createHash("sha256")
      .update(`${studentEmail.toLowerCase()}:${JSON.stringify(parsed.data.profile)}`)
      .digest("hex");
    const result = await new Resend(apiKey).emails.send(
      {
        from,
        to: [studentEmail],
        subject: `${plan.partnerUniversity.name} exchange plan`,
        html,
        attachments: [{
          filename: `${slugify(plan.partnerUniversity.name)}-exchange-plan.pdf`,
          content: pdf
        }]
      },
      { idempotencyKey }
    );

    if (result.error) {
      console.error("Report provider rejected delivery", result.error.name);
      return jsonNoStore({ error: "The email provider could not deliver this report." }, 502);
    }
    return jsonNoStore({ sent: true, recipient: studentEmail }, 200);
  } catch (error) {
    if (error instanceof DestinationResolutionError) {
      return jsonNoStore({ error: error.message }, 422);
    }
    console.error("Report email failed", error instanceof Error ? error.name : "UnknownError");
    return jsonNoStore({ error: "The report could not be generated or delivered." }, 502);
  }
}

function jsonNoStore(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
