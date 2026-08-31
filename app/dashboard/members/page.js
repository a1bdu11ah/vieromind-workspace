import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findTenant, findUser, listMembers } from "@/lib/data";
import DashboardShell from "@/components/DashboardShell";
import MemberManager from "@/components/MemberManager";

export default async function MembersPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  const [user, tenant, records] = await Promise.all([
    findUser(auth.userId, auth.tenantId),
    findTenant(auth.tenantId),
    listMembers(auth.tenantId)
  ]);
  if (!user || !tenant) redirect("/login");
  const format = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
  const members = records.map(member => ({ id: member.id, name: member.name, email: member.email, role: member.role, joined: format.format(new Date(member.createdAt)) }));

  return <DashboardShell active="users" user={user} tenant={tenant}><div className="page-wrap"><MemberManager initialMembers={members} currentUserId={user.id} currentRole={user.role}/></div></DashboardShell>;
}
