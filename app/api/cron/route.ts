import { env } from "@/lib/env";

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Scheduled work goes here.

  return Response.json({ status: "ok" });
}
