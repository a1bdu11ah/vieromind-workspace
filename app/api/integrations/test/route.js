import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findUser } from "@/lib/data";
import { dispatchWebhook } from "@/lib/webhooks";

export async function POST() {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const actor = await findUser(auth.userId, auth.tenantId);
    if (!actor || !["owner", "admin"].includes(actor.role)) {
      return NextResponse.json({ message: "Only owners and admins can test integrations." }, { status: 403 });
    }
    const result = await dispatchWebhook(auth.tenantId, "integration.test", {
      message: "Your Viero webhook integration is connected.",
      sentBy: { id: actor.id, name: actor.name }
    });
    if (result.status === "skipped") {
      return NextResponse.json({ message: "Save and enable the integration first." }, { status: 400 });
    }
    if (result.status === "failed") {
      return NextResponse.json({ message: result.error || `The endpoint returned HTTP ${result.httpStatus}.` }, { status: 502 });
    }
    return NextResponse.json({ message: "Test webhook delivered.", deliveryId: result.deliveryId });
  } catch {
    return NextResponse.json({ message: "Could not send the test webhook." }, { status: 500 });
  }
}
