import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import DashboardShell from "@/components/DashboardShell";
import MemberManager from "@/components/MemberManager";

export default async function MembersPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  await connectDB();
  const [user, tenant, records] = await Promise.all([
    User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("name email role").lean(),
    Tenant.findById(auth.tenantId).select("name slug").lean(),
    User.find({ tenantId: auth.tenantId }).select("name email role createdAt").sort({ createdAt: 1 }).lean()
  ]);
  if (!user || !tenant) redirect("/login");
  const format = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
  const members = records.map(member => ({ id: member._id.toString(), name: member.name, email: member.email, role: member.role, joined: format.format(new Date(member.createdAt)) }));

  return <DashboardShell active="users" user={user} tenant={tenant}><div className="page-wrap"><MemberManager initialMembers={members} currentUserId={user._id.toString()} currentRole={user.role}/></div></DashboardShell>;
}
