import { pingDatabase } from "@/features/health/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await pingDatabase();
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
