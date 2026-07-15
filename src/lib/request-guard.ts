type RateLimitBucket = { count: number; resetAt: number };

const RATE_LIMIT_BUCKET_CAPACITY = 2_048;
const GLOBAL_RATE_LIMIT_BUCKET_CAPACITY = 64;
const RATE_LIMIT_PRUNE_BUDGET = 32;
const buckets = new Map<string, RateLimitBucket>();
const globalBuckets = new Map<string, RateLimitBucket>();

// This limiter and concurrency gates are process-local safeguards. A shared
// backing store is still required when limits must span multiple instances.
export const REQUEST_GUARD_SCOPE = "process-local" as const;
export const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export function takeRateLimit(key: string, max: number, windowMs: number) {
  return takeRateLimitFromStore(buckets, RATE_LIMIT_BUCKET_CAPACITY, key, max, windowMs);
}

export function takeGlobalRateLimit(key: string, max: number, windowMs: number) {
  return takeRateLimitFromStore(
    globalBuckets,
    GLOBAL_RATE_LIMIT_BUCKET_CAPACITY,
    key,
    max,
    windowMs
  );
}

function takeRateLimitFromStore(
  store: Map<string, RateLimitBucket>,
  capacity: number,
  key: string,
  max: number,
  windowMs: number
) {
  if (!key || !Number.isInteger(max) || max < 1 || !Number.isFinite(windowMs) || windowMs <= 0) {
    throw new TypeError("Invalid rate-limit configuration.");
  }

  const now = Date.now();
  const current = store.get(key);
  if (current?.resetAt && current.resetAt <= now) {
    store.delete(key);
  }

  const active = store.get(key);
  if (!active) {
    pruneExpiredBuckets(store, now);
    if (store.size >= capacity) {
      return { allowed: false, retryAfterSeconds: 1 };
    }
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (active.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((active.resetAt - now) / 1000)) };
  }
  active.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function requestClientKey(request: Request) {
  if (process.env.TRUST_PROXY_HEADERS !== "true") {
    return "unattributed";
  }

  const forwarded = request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded ? `proxy:${forwarded.slice(0, 128)}` : "unattributed";
}

export function takeTrustedClientRateLimit(
  request: Request,
  namespace: string,
  max: number,
  windowMs: number
) {
  const clientKey = requestClientKey(request);
  if (clientKey === "unattributed") {
    return { allowed: true, retryAfterSeconds: 0, attributed: false as const };
  }
  return {
    ...takeRateLimit(`${namespace}:${clientKey}`, max, windowMs),
    attributed: true as const
  };
}

export function validHttpOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.origin === value
      ? value
      : null;
  } catch {
    return null;
  }
}

export function hasExactRequestOrigin(request: Request, allowedOrigin: string) {
  return request.headers.get("origin") === allowedOrigin;
}

export async function readBoundedJson(request: Request, maxBytes = 32_768) {
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError("Invalid request body limit.");
  }
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return { ok: false as const, status: 415, error: "Content-Type must be application/json." };
  }

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader !== null) {
    if (!/^\d+$/.test(lengthHeader)) {
      return { ok: false as const, status: 400, error: "Invalid Content-Length header." };
    }
    if (Number(lengthHeader) > maxBytes) {
      return { ok: false as const, status: 413, error: "Request body is too large." };
    }
  }

  const body = await readBodyWithinLimit(request, maxBytes);
  if (!body.ok) return body;

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(body.value);
    return { ok: true as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false as const, status: 400, error: "Invalid JSON request." };
  }
}

export function createConcurrencyGate(maxConcurrent: number) {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new TypeError("Invalid concurrency limit.");
  }

  let active = 0;
  return {
    tryAcquire() {
      if (active >= maxConcurrent) return null;
      active += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        active -= 1;
      };
    }
  };
}

function pruneExpiredBuckets(store: Map<string, RateLimitBucket>, now: number) {
  let inspected = 0;
  for (const [bucketKey, bucket] of store) {
    if (inspected >= RATE_LIMIT_PRUNE_BUDGET) break;
    inspected += 1;
    store.delete(bucketKey);
    if (bucket.resetAt > now) store.set(bucketKey, bucket);
  }
}

async function readBodyWithinLimit(request: Request, maxBytes: number) {
  if (!request.body) return { ok: true as const, value: new Uint8Array() };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The size decision is already final even if the source rejects cancellation.
        }
        return { ok: false as const, status: 413, error: "Request body is too large." };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false as const, status: 400, error: "Request body could not be read." };
  }

  const value = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    value.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true as const, value };
}

// Test hooks intentionally expose aggregate state only, never bucket keys.
export function __resetRequestGuardForTests() {
  buckets.clear();
  globalBuckets.clear();
}

export function __requestGuardStatsForTests() {
  return {
    bucketCount: buckets.size,
    bucketCapacity: RATE_LIMIT_BUCKET_CAPACITY,
    globalBucketCount: globalBuckets.size,
    globalBucketCapacity: GLOBAL_RATE_LIMIT_BUCKET_CAPACITY,
    pruneBudget: RATE_LIMIT_PRUNE_BUDGET,
    scope: REQUEST_GUARD_SCOPE
  };
}
