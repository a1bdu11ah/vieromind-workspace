import { NextResponse } from "next/server";
import { pingDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await pingDB();
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      service: "viero-tenant-app"
    });
  } catch (error) {
    console.error("Health check failed:", error.message);
    return NextResponse.json({
      status: "unhealthy",
      database: "disconnected",
      message: process.env.DATABASE_URL ? "PostgreSQL connection failed." : "DATABASE_URL is missing."
    }, { status: 503 });
  }
}
