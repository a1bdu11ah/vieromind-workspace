import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import DashboardShell from "@/components/DashboardShell";
import WorkspaceSettings from "@/components/WorkspaceSettings";

export default async function SettingsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  await connectDB();
  const [user, tenant] = await Promise.all([
    User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("name email role").lean(),
    Tenant.findById(auth.tenantId).select("name slug").lean()
  ]);
  if (!user || !tenant) redirect("/login");
  const safeUser = { name: user.name, email: user.email, role: user.role };
  const safeTenant = { name: tenant.name, slug: tenant.slug };
  return <DashboardShell active="settings" user={user} tenant={tenant}><div className="page-wrap"><WorkspaceSettings tenant={safeTenant} user={safeUser}/></div></DashboardShell>;
}
