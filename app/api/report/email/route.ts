import { createHash } from "node:crypto";
import { render } from "react-email";
import { Resend } from "resend";
import { z } from "zod";
import { ExchangePlanEmail } from "@/emails/ExchangePlanEmail";
import { buildPlanResponseForInput, DestinationResolutionError } from "@/lib/plan-engine";
import { readBoundedJson, requestClientKey, takeRateLimit } from "@/lib/request-guard";
import { renderPlanPdf } from "@/lib/report-pdf";
import { exchangeProfileInputSchema } from "@/lib/schema";

export const runtime = "nodejs";

const emailReportSchema = z.object({ profile: exchangeProfileInputSchema });

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Cross-site email delivery is not allowed." }, { status: 403 });
  }

  const allowedOrigin = process.env.APP_ORIGIN ?? new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== allowedOrigin) {
    return Response.json({ error: "Email delivery origin is not allowed." }, { status: 403 });
  }

  const bodyResult = await readBoundedJson(request);
  if (!bodyResult.ok) {
    return Response.json({ error: bodyResult.error }, { status: bodyResult.status });
  }
  const parsed = emailReportSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email report request", issues: parsed.error.flatten() }, { status: 400 });
  }

  const studentEmail = parsed.data.profile.studentEmail?.trim();
  if (!studentEmail) {
    return Response.json({ error: "A student email is required." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const allowlist = new Set(
    (process.env.REPORT_EMAIL_ALLOWLIST ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

  if (!apiKey || !from || allowlist.size === 0) {
    return Response.json(
      { error: "Email delivery is not configured", fallback: "Download the PDF report instead." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!allowlist.has(studentEmail.toLowerCase())) {
    return Response.json(
      { error: "This student email is not enabled for demo report delivery." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const clientLimit = takeRateLimit(`email-client:${requestClientKey(request)}`, 3, 15 * 60 * 1000);
  const recipientLimit = takeRateLimit(`email-recipient:${studentEmail.toLowerCase()}`, 3, 24 * 60 * 60 * 1000);
  if (!clientLimit.allowed || !recipientLimit.allowed) {
    const retryAfter = Math.max(clientLimit.retryAfterSeconds, recipientLimit.retryAfterSeconds);
    return Response.json(
      { error: "Too many report emails. Try again after the cooldown." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
    );
  }

  try {
    const { plan } = buildPlanResponseForInput(parsed.data.profile);
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
      return Response.json({ error: "The email provider could not deliver this report." }, { status: 502 });
    }
    return Response.json(
      { sent: true, recipient: studentEmail },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof DestinationResolutionError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    console.error("Report email failed", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ error: "The report could not be generated or delivered." }, { status: 502 });
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
