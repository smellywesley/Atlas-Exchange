const buckets = new Map<string, { count: number; resetAt: number }>();

export function takeRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  for (const [bucketKey, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(bucketKey);
  }

  const current = buckets.get(key);
  if (!current) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function requestClientKey(request: Request) {
  return request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
}

export async function readBoundedJson(request: Request, maxBytes = 32_768) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false as const, status: 415, error: "Content-Type must be application/json." };
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    return { ok: false as const, status: 413, error: "Request body is too large." };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { ok: false as const, status: 413, error: "Request body is too large." };
  }
  try {
    return { ok: true as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false as const, status: 400, error: "Invalid JSON request." };
  }
}
