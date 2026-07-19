import { pingDatabase } from "@/features/health/data";
import { env } from "@/lib/env";
import { NextResponse, type NextRequest } from "next/server";

// Scheduled-job stub. Unset CRON_SECRET = endpoint disabled (same optional-feature pattern as Stripe).
export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!env.CRON_SECRET || authorization !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Scheduled work goes here. Default job: keep the database awake.
  try {
    await pingDatabase();
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }

  return NextResponse.json({ status: "ok" });
}
