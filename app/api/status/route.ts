import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/provider-status";

export function GET() {
  return NextResponse.json(getProviderStatus());
}
