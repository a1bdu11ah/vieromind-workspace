import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import Task from "@/models/Task";
import DashboardShell from "@/components/DashboardShell";
import Image from "next/image";

export default async function Dashboard() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  await connectDB();
  const [user, tenant, members, memberCount, admins] = await Promise.all([
    User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("name email role createdAt").lean(),
    Tenant.findById(auth.tenantId).select("name slug createdAt").lean(),
    User.find({ tenantId: auth.tenantId }).select("name email role createdAt").sort({ createdAt: -1 }).limit(4).lean(),
    User.countDocuments({ tenantId: auth.tenantId }),
    User.countDocuments({ tenantId: auth.tenantId, role: { $in: ["owner", "admin"] } })
  ]);
  if (!user || !tenant) redirect("/login");

  const manager = ["owner", "admin"].includes(user.role);
  const taskScope = manager ? { tenantId: auth.tenantId } : { tenantId: auth.tenantId, assignedTo: auth.userId };
  const tasks = await Task.find(taskScope).populate("assignedTo", "name").sort({ createdAt: -1 }).lean();
  const completed = tasks.filter(task => task.status === "completed").length;
  const average = tasks.length ? Math.round(tasks.reduce((total, task) => total + task.progress, 0) / tasks.length) : 0;

  return <DashboardShell active="grid" user={user} tenant={tenant}>
    <div className="page-wrap">
      <header className="page-header">
        <div><p className="kicker">Overview</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p>Here is what is happening in your workspace today.</p></div>
        <Link href="/dashboard/tasks" className="primary-action"><span>+</span> {manager ? "Assign a task" : "View my tasks"}</Link>
      </header>

      <section className="metric-grid">
        <article><div className="metric-icon violet">↗</div><div><span>Total members</span><strong>{memberCount}</strong><small>Active in this workspace</small></div></article>
        <article><div className="metric-icon blue">□</div><div><span>{manager ? "Team tasks" : "My tasks"}</span><strong>{tasks.length}</strong><small>{completed} completed</small></div></article>
        <article><div className="metric-icon green">✓</div><div><span>Overall progress</span><strong>{average}%</strong><small>Across visible tasks</small></div></article>
      </section>

      <section className="dashboard-grid">
        <article className="surface team-preview">
          <div className="surface-head"><div><p className="kicker">Task pulse</p><h2>Latest work</h2></div><Link href="/dashboard/tasks">Open task board <span>→</span></Link></div>
          <div className="overview-task-list">
            {tasks.slice(0, 4).map(task => <div className="overview-task" key={task._id.toString()}>
              <span className={`status-dot ${task.status}`}/><div><strong>{task.title}</strong><small>{task.assignedTo?.name || "Former member"}</small></div>
              <div className="mini-progress"><span>{task.progress}%</span><div className="progress-track"><i style={{ width: `${task.progress}%` }}/></div></div>
            </div>)}
            {!tasks.length && <div className="empty-overview"><span>✓</span><strong>No tasks yet</strong><p>{manager ? "Assign the first task to get your team moving." : "Nothing has been assigned to you yet."}</p></div>}
          </div>
        </article>
        <aside className="surface workspace-card">
          <div className="workspace-card-art"><span><Image src="/vieromind-logo.png" alt="VieroMind" width={45} height={45}/></span></div>
          <p className="kicker">Workspace</p><h2>{tenant.name}</h2>
          <p>Your team's private, secure home for shared work.</p>
          <div className="workspace-detail"><span>Administrators</span><strong>{admins}</strong></div>
          <div className="workspace-detail"><span>Your access</span><strong className="capitalize">{user.role}</strong></div>
          <Link href="/dashboard/settings">Manage workspace →</Link>
        </aside>
      </section>

      <section className="surface people-strip">
        <div className="surface-head"><div><p className="kicker">People</p><h2>Workspace members</h2></div><Link href="/dashboard/members">Manage team <span>→</span></Link></div>
        <div>{members.map((member, index) => <div className="person-chip" key={member._id.toString()}><span className={`avatar color-${index % 4}`}>{member.name?.[0]?.toUpperCase()}</span><div><strong>{member.name}</strong><small className="capitalize">{member.role}</small></div></div>)}</div>
      </section>
    </div>
  </DashboardShell>;
}
