import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const connection = await connectDB();
    await connection.connection.db.admin().ping();
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
      message: process.env.MONGODB_URI ? "Atlas connection failed." : "MONGODB_URI is missing."
    }, { status: 503 });
  }
}
