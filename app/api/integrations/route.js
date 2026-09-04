import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findUser } from "@/lib/data";
import { getIntegration, listDeliveries, saveIntegration } from "@/lib/integrations";
import { parseWebhookUrl } from "@/lib/webhooks";

async function managerForRequest() {
  const auth = await getCurrentUser();
  if (!auth) return { error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  const actor = await findUser(auth.userId, auth.tenantId);
  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return { error: NextResponse.json({ message: "Only owners and admins can manage integrations." }, { status: 403 }) };
  }
  return { auth };
}

export async function GET() {
  try {
    const { auth, error } = await managerForRequest();
    if (error) return error;
    const [integration, deliveries] = await Promise.all([
      getIntegration(auth.tenantId),
      listDeliveries(auth.tenantId)
    ]);
    return NextResponse.json({ integration, deliveries });
  } catch {
    return NextResponse.json({ message: "Could not load integration settings." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { auth, error } = await managerForRequest();
    if (error) return error;
    const body = await request.json();
    const endpointUrl = body.endpointUrl?.trim() ? parseWebhookUrl(body.endpointUrl.trim()) : "";
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";
    if (secret && (secret.length < 24 || secret.length > 200)) {
      return NextResponse.json({ message: "The integration secret must be 24–200 characters." }, { status: 400 });
    }
    const current = await getIntegration(auth.tenantId);
    const enabled = Boolean(body.enabled);
    if (enabled && !endpointUrl) {
      return NextResponse.json({ message: "Add an HTTPS endpoint before enabling outgoing webhooks." }, { status: 400 });
    }
    if (enabled && !secret && !current.hasSecret) {
      return NextResponse.json({ message: "Generate an integration secret before enabling webhooks." }, { status: 400 });
    }
    const integration = await saveIntegration(auth.tenantId, { endpointUrl, secret, enabled });
    return NextResponse.json({ integration });
  } catch (error) {
    const message = error.message?.includes("endpoint") || error.message?.includes("Webhook") || error.message?.includes("Private")
      ? error.message
      : "Could not save integration settings.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
