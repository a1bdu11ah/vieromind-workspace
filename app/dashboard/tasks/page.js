import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findTenant, findUser, listMembersByName, listTasks } from "@/lib/data";
import DashboardShell from "@/components/DashboardShell";
import TaskBoard from "@/components/TaskBoard";

export default async function TasksPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  const [user, tenant, members] = await Promise.all([
    findUser(auth.userId, auth.tenantId),
    findTenant(auth.tenantId),
    listMembersByName(auth.tenantId)
  ]);
  if (!user || !tenant) redirect("/login");
  const manager = ["owner", "admin"].includes(user.role);
  const tasks = (await listTasks(auth.tenantId, auth.userId, manager)).filter(task => task.assignee);
  const safeMembers = members.map(member => ({ id: member.id, name: member.name, email: member.email }));

  return <DashboardShell active="tasks" user={user} tenant={tenant}><div className="page-wrap task-page"><TaskBoard initialTasks={tasks} members={safeMembers} currentRole={user.role} currentUserId={user.id}/></div></DashboardShell>;
}
