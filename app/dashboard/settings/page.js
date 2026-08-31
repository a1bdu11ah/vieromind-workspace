import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findTenant, findUser } from "@/lib/data";
import DashboardShell from "@/components/DashboardShell";
import WorkspaceSettings from "@/components/WorkspaceSettings";

export default async function SettingsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  const [user, tenant] = await Promise.all([
    findUser(auth.userId, auth.tenantId),
    findTenant(auth.tenantId)
  ]);
  if (!user || !tenant) redirect("/login");
  const safeUser = { name: user.name, email: user.email, role: user.role };
  const safeTenant = { name: tenant.name, slug: tenant.slug };
  return <DashboardShell active="settings" user={user} tenant={tenant}><div className="page-wrap"><WorkspaceSettings tenant={safeTenant} user={safeUser}/></div></DashboardShell>;
}
