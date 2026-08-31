import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Tenant from "@/models/Tenant";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await connectDB();

  // Tenant isolation: every query is scoped by tenantId.
  const [user, tenant, memberCount] = await Promise.all([
    User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("name email role").lean(),
    Tenant.findById(auth.tenantId).select("name slug").lean(),
    User.countDocuments({ tenantId: auth.tenantId })
  ]);

  if (!user || !tenant) return NextResponse.json({ message: "Account not found" }, { status: 404 });
  return NextResponse.json({ user, tenant, memberCount });
}
