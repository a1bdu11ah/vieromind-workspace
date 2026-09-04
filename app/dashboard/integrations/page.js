import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findTenant, findUser } from "@/lib/data";
import { getIntegration, listDeliveries } from "@/lib/integrations";
import DashboardShell from "@/components/DashboardShell";
import IntegrationsPanel from "@/components/IntegrationsPanel";

export default async function IntegrationsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  const [user, tenant, integration, deliveries] = await Promise.all([
    findUser(auth.userId, auth.tenantId), findTenant(auth.tenantId),
    getIntegration(auth.tenantId), listDeliveries(auth.tenantId)
  ]);
  if (!user || !tenant) redirect("/login");
  return <DashboardShell active="integrations" user={user} tenant={tenant}>
    <div className="page-wrap"><IntegrationsPanel initialIntegration={integration} initialDeliveries={deliveries} tenantSlug={tenant.slug} canEdit={["owner", "admin"].includes(user.role)}/></div>
  </DashboardShell>;
}
