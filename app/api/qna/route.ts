import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { answerQuestion, qnaRequestSchema } from "@/lib/qna-engine";
import {
  NO_STORE_HEADERS,
  readBoundedJson,
  takeGlobalRateLimit,
  takeTrustedClientRateLimit
} from "@/lib/request-guard";

export async function POST(request: Request) {
  const body = await readBoundedJson(request, 32_768);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status, headers: NO_STORE_HEADERS });
  }
  const parsed = qnaRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Q&A request.", issues: parsed.error.flatten() },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const globalLimit = takeGlobalRateLimit("route:qna", 300, 60_000);
  const rateLimit = takeTrustedClientRateLimit(request, "qna-client", 40, 15 * 60_000);
  if (!globalLimit.allowed || !rateLimit.allowed) {
    const retryAfter = Math.max(globalLimit.retryAfterSeconds, rateLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many Q&A requests." },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) }
      }
    );
  }

  try {
    return NextResponse.json(answerQuestion(parsed.data), { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid Q&A request.", issues: error.flatten() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    console.error("Q&A failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Q&A could not be completed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
