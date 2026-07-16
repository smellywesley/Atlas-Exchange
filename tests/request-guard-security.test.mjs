import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadRequestGuard() {
  const source = fs.readFileSync(path.resolve("src/lib/request-guard.ts"), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    process,
    Request,
    Response,
    Headers,
    URL,
    ReadableStream,
    TextDecoder,
    Uint8Array,
    TypeError,
    Date
  });
  return module.exports;
}

const guard = loadRequestGuard();

test.beforeEach(() => {
  delete process.env.TRUST_PROXY_HEADERS;
  guard.__resetRequestGuardForTests();
});

test("rate limiter remains fixed-capacity and exposes no bucket identities", () => {
  const initial = guard.__requestGuardStatsForTests();
  let overflowResult;
  for (let index = 0; index < initial.bucketCapacity + 200; index += 1) {
    overflowResult = guard.takeRateLimit(`attacker-${index}`, 1, 60_000);
  }

  const stats = guard.__requestGuardStatsForTests();
  assert.equal(stats.bucketCount, stats.bucketCapacity);
  assert.equal(overflowResult.allowed, false);
  assert.equal(stats.scope, "process-local");
  assert.equal(Object.hasOwn(stats, "keys"), false);
  assert.ok(stats.pruneBudget < stats.bucketCapacity);
});

test("attacker-cardinality buckets cannot evict global route limits", () => {
  assert.equal(guard.takeGlobalRateLimit("route:fixed", 1, 60_000).allowed, true);
  const { bucketCapacity } = guard.__requestGuardStatsForTests();
  for (let index = 0; index < bucketCapacity + 200; index += 1) {
    guard.takeRateLimit(`client-${index}`, 1, 60_000);
  }

  assert.equal(guard.takeGlobalRateLimit("route:fixed", 1, 60_000).allowed, false);
  assert.equal(guard.__requestGuardStatsForTests().globalBucketCount, 1);
});

test("expired buckets reset and retry windows never return zero", async () => {
  assert.equal(guard.takeRateLimit("fixed-route", 1, 5).allowed, true);
  const rejected = guard.takeRateLimit("fixed-route", 1, 5);
  assert.equal(rejected.allowed, false);
  assert.equal(rejected.retryAfterSeconds, 1);

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(guard.takeRateLimit("fixed-route", 1, 5).allowed, true);
});

test("forwarding headers are ignored unless explicitly trusted", () => {
  const request = new Request("https://app.example/api", {
    headers: {
      "x-real-ip": "203.0.113.20",
      "x-forwarded-for": "198.51.100.10, 192.0.2.2"
    }
  });

  assert.equal(guard.requestClientKey(request), "unattributed");
  process.env.TRUST_PROXY_HEADERS = "true";
  assert.equal(guard.requestClientKey(request), "proxy:203.0.113.20");
});

test("unattributed requests do not collapse all users into one client bucket", () => {
  const request = new Request("https://atlas.test/api/plan");
  for (let index = 0; index < 5; index += 1) {
    const result = guard.takeTrustedClientRateLimit(request, "plan-client", 1, 60_000);
    assert.equal(result.allowed, true);
    assert.equal(result.attributed, false);
  }
  assert.equal(guard.__requestGuardStatsForTests().bucketCount, 0);
});

test("configured origins must be canonical and request origins must match exactly", () => {
  assert.equal(guard.validHttpOrigin("https://app.example"), "https://app.example");
  assert.equal(guard.validHttpOrigin("https://app.example/path"), null);
  assert.equal(guard.validHttpOrigin("https://app.example/"), null);
  assert.equal(guard.validHttpOrigin(undefined), null);

  const request = new Request("https://app.example/api", {
    headers: { origin: "https://app.example" }
  });
  assert.equal(guard.hasExactRequestOrigin(request, "https://app.example"), true);
  assert.equal(guard.hasExactRequestOrigin(request, "https://other.example"), false);
  assert.equal(guard.hasExactRequestOrigin(new Request("https://app.example/api"), "https://app.example"), false);
});

test("bounded JSON rejects oversized streamed bodies without a Content-Length", async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"value":"'));
      controller.enqueue(new Uint8Array(128));
      controller.enqueue(new TextEncoder().encode('"}'));
      controller.close();
    }
  });
  const request = new Request("https://app.example/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half"
  });

  const result = await guard.readBoundedJson(request, 64);
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
});

test("bounded JSON accepts a valid body within the limit", async () => {
  const request = new Request("https://app.example/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ destination: "London" })
  });

  const result = await guard.readBoundedJson(request, 128);
  assert.equal(result.ok, true);
  assert.equal(result.value.destination, "London");
});

test("bounded JSON requires the exact JSON media type", async () => {
  const request = new Request("https://app.example/api", {
    method: "POST",
    headers: { "content-type": "application/jsonp" },
    body: "{}"
  });

  const result = await guard.readBoundedJson(request, 128);
  assert.equal(result.ok, false);
  assert.equal(result.status, 415);
});

test("concurrency gate enforces its ceiling and releases idempotently", () => {
  const gate = guard.createConcurrencyGate(2);
  const releaseFirst = gate.tryAcquire();
  const releaseSecond = gate.tryAcquire();
  assert.equal(typeof releaseFirst, "function");
  assert.equal(typeof releaseSecond, "function");
  assert.equal(gate.tryAcquire(), null);

  releaseFirst();
  releaseFirst();
  const releaseThird = gate.tryAcquire();
  assert.equal(typeof releaseThird, "function");
  releaseSecond();
  releaseThird();
});

test("security headers include framing, MIME, policy, and CSP protections", async () => {
  const { default: nextConfig } = await import("../next.config.mjs");
  const entries = await nextConfig.headers();
  const headers = Object.fromEntries(entries[0].headers.map(({ key, value }) => [key, value]));

  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /frame-src https:\/\/maps\.google\.com/);
  assert.equal(headers["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
});

test("PDF route validates the profile before allocating client quota", () => {
  const pdfRoute = fs.readFileSync(path.resolve("app/api/report/pdf/route.ts"), "utf8");

  assert.ok(pdfRoute.indexOf("safeParse(body.profile)") < pdfRoute.indexOf('"pdf-client"'));
});
