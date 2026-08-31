import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findTenant, findUser, workspaceCounts } from "@/lib/data";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // Tenant isolation: every query is scoped by tenantId.
  const [user, tenant, counts] = await Promise.all([
    findUser(auth.userId, auth.tenantId),
    findTenant(auth.tenantId),
    workspaceCounts(auth.tenantId)
  ]);

  if (!user || !tenant) return NextResponse.json({ message: "Account not found" }, { status: 404 });
  return NextResponse.json({ user, tenant, memberCount: counts.memberCount });
}
