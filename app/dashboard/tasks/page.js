import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import Task from "@/models/Task";
import DashboardShell from "@/components/DashboardShell";
import TaskBoard from "@/components/TaskBoard";

export default async function TasksPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  await connectDB();
  const [user, tenant, members] = await Promise.all([
    User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("name email role").lean(),
    Tenant.findById(auth.tenantId).select("name slug").lean(),
    User.find({ tenantId: auth.tenantId }).select("name email").sort({ name: 1 }).lean()
  ]);
  if (!user || !tenant) redirect("/login");
  const manager = ["owner", "admin"].includes(user.role);
  const scope = manager ? { tenantId: auth.tenantId } : { tenantId: auth.tenantId, assignedTo: auth.userId };
  const records = await Task.find(scope).populate("assignedTo", "name email").populate("createdBy", "name").sort({ createdAt: -1 }).lean();
  const tasks = records.filter(task => task.assignedTo).map(task => ({
    id: task._id.toString(), title: task.title, description: task.description || "", status: task.status,
    priority: task.priority, progress: task.progress, dueDate: task.dueDate?.toISOString() || null,
    assignee: { id: task.assignedTo._id.toString(), name: task.assignedTo.name, email: task.assignedTo.email },
    creator: task.createdBy ? { name: task.createdBy.name } : null
  }));
  const safeMembers = members.map(member => ({ id: member._id.toString(), name: member.name, email: member.email }));

  return <DashboardShell active="tasks" user={user} tenant={tenant}><div className="page-wrap task-page"><TaskBoard initialTasks={tasks} members={safeMembers} currentRole={user.role} currentUserId={user._id.toString()}/></div></DashboardShell>;
}
