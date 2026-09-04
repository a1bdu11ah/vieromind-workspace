import { NextResponse } from "next/server";
import { createTask, findUserByEmailForTenant } from "@/lib/data";
import { createDelivery, findIntegrationByTenantSlug } from "@/lib/integrations";
import { secretsMatch } from "@/lib/webhooks";

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const integration = await findIntegrationByTenantSlug(slug);
    if (!integration?.enabled || !integration.secret) {
      return NextResponse.json({ message: "Webhook endpoint not found." }, { status: 404 });
    }

    const authorization = request.headers.get("authorization") || "";
    const providedSecret = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!secretsMatch(providedSecret, integration.secret)) {
      return NextResponse.json({ message: "Invalid webhook secret." }, { status: 401 });
    }

    const body = await request.json();
    if (body.event !== "task.create") {
      await createDelivery({ tenantId: integration.tenant_id, event: body.event || "unknown", direction: "incoming", status: "failed", responseExcerpt: "Unsupported event." });
      return NextResponse.json({ message: "Supported event: task.create" }, { status: 400 });
    }
    const data = body.data || {};
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const assigneeEmail = typeof data.assigneeEmail === "string" ? data.assigneeEmail.trim() : "";
    if (!title || title.length > 120 || !assigneeEmail) {
      await createDelivery({ tenantId: integration.tenant_id, event: body.event, direction: "incoming", status: "failed", responseExcerpt: "Invalid task payload." });
      return NextResponse.json({ message: "title and assigneeEmail are required." }, { status: 400 });
    }
    const priority = data.priority || "medium";
    if (!["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ message: "priority must be low, medium, or high." }, { status: 400 });
    }
    if (data.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) {
      return NextResponse.json({ message: "dueDate must use YYYY-MM-DD format." }, { status: 400 });
    }
    const assignee = await findUserByEmailForTenant(assigneeEmail, integration.tenant_id);
    if (!assignee) {
      await createDelivery({ tenantId: integration.tenant_id, event: body.event, direction: "incoming", status: "failed", responseExcerpt: "Assignee not found in workspace." });
      return NextResponse.json({ message: "No workspace member has that email address." }, { status: 404 });
    }

    const task = await createTask({
      tenantId: integration.tenant_id,
      title,
      description: typeof data.description === "string" ? data.description.trim().slice(0, 1000) : "",
      assignedTo: assignee.id,
      createdBy: null,
      priority,
      dueDate: data.dueDate || null
    });
    const deliveryId = await createDelivery({ tenantId: integration.tenant_id, event: body.event, direction: "incoming", status: "succeeded" });
    return NextResponse.json({ task, deliveryId }, { status: 201 });
  } catch (error) {
    console.error("Incoming webhook failed:", error);
    return NextResponse.json({ message: "Could not process webhook." }, { status: 500 });
  }
}
