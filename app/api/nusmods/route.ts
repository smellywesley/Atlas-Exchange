import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { lookupNusModule, NusModsError } from "@/lib/academic-modules";
import { nusModsLookupSchema } from "@/lib/academic-modules";
import { NO_STORE_HEADERS, takeGlobalRateLimit, takeTrustedClientRateLimit } from "@/lib/request-guard";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = nusModsLookupSchema.safeParse({
    academicYear: url.searchParams.get("academicYear"),
    moduleCode: url.searchParams.get("moduleCode")
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid NUSMods lookup.", issues: parsed.error.flatten() },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const globalLimit = takeGlobalRateLimit("route:nusmods", 240, 60_000);
  const rateLimit = takeTrustedClientRateLimit(request, "nusmods-client", 30, 60_000);
  if (!globalLimit.allowed || !rateLimit.allowed) {
    const retryAfter = Math.max(globalLimit.retryAfterSeconds, rateLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many NUSMods requests." },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) }
      }
    );
  }

  try {
    const result = await lookupNusModule(parsed.data);
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid NUSMods lookup.", issues: error.flatten() },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    if (error instanceof NusModsError) {
      const status = error.kind === "not-found" ? 404 : error.kind === "timeout" ? 504 : 502;
      return NextResponse.json({ error: error.message }, { status, headers: NO_STORE_HEADERS });
    }
    console.error("NUSMods lookup failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "NUSMods lookup failed." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
