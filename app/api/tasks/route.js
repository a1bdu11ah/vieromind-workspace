import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createTask, findMember, findUser, listTasks } from "@/lib/data";

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const actor = await findUser(auth.userId, auth.tenantId);
    if (!actor) return NextResponse.json({ message: "Account not found." }, { status: 404 });
    const tasks = await listTasks(auth.tenantId, auth.userId, ["owner", "admin"].includes(actor.role));
    return NextResponse.json({ tasks: tasks.filter(task => task.assignee) });
  } catch {
    return NextResponse.json({ message: "Could not load tasks." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const actor = await findUser(auth.userId, auth.tenantId);
    if (!actor || !["owner", "admin"].includes(actor.role)) return NextResponse.json({ message: "Only owners and admins can assign tasks." }, { status: 403 });
    const { title, description = "", assignedTo, priority = "medium", dueDate } = await request.json();
    if (!title?.trim() || !assignedTo) return NextResponse.json({ message: "Task title and assignee are required." }, { status: 400 });
    if (!["low", "medium", "high"].includes(priority)) return NextResponse.json({ message: "Invalid priority." }, { status: 400 });
    const assignee = await findMember(assignedTo, auth.tenantId);
    if (!assignee) return NextResponse.json({ message: "Assignee is not part of this workspace." }, { status: 400 });
    const task = await createTask({ title: title.trim(), description: description.trim(), tenantId: auth.tenantId, assignedTo: assignee.id, createdBy: auth.userId, priority, dueDate: dueDate || null });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Could not create task." }, { status: 500 });
  }
}
