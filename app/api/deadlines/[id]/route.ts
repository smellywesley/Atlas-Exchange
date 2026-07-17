import { NextResponse } from "next/server";
import {
  deadlineIdSchema,
  deleteDeadline,
  getDeadline,
  personalDeadlineUpdateSchema,
  updateDeadline
} from "@/lib/deadline-store";
import {
  NO_STORE_HEADERS,
  readBoundedJson,
  takeGlobalRateLimit,
  takeTrustedClientRateLimit
} from "@/lib/request-guard";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const parsedId = deadlineIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid deadline id." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const limit = takeGlobalRateLimit("route:deadlines-get", 300, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const deadline = getDeadline(parsedId.data);
  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(deadline, { headers: NO_STORE_HEADERS });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const parsedId = deadlineIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid deadline id." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const bodyResult = await readBoundedJson(request, 8_192);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status, headers: NO_STORE_HEADERS });
  }
  const parsed = personalDeadlineUpdateSchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid deadline update", issues: parsed.error.flatten() },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const globalLimit = takeGlobalRateLimit("route:deadlines-write", 120, 60 * 1000);
  const clientLimit = takeTrustedClientRateLimit(request, "deadlines-write-client", 30, 60 * 1000);
  if (!globalLimit.allowed || !clientLimit.allowed) {
    const retryAfter = Math.max(globalLimit.retryAfterSeconds, clientLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) } }
    );
  }

  const deadline = updateDeadline(parsedId.data, parsed.data);
  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(deadline, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const parsedId = deadlineIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid deadline id." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const globalLimit = takeGlobalRateLimit("route:deadlines-write", 120, 60 * 1000);
  const clientLimit = takeTrustedClientRateLimit(request, "deadlines-write-client", 30, 60 * 1000);
  if (!globalLimit.allowed || !clientLimit.allowed) {
    const retryAfter = Math.max(globalLimit.retryAfterSeconds, clientLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Try again after the cooldown." },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) } }
    );
  }

  const deleted = deleteDeadline(parsedId.data);
  if (!deleted) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
