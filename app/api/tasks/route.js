import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Task from "@/models/Task";

function serialize(task) {
  return {
    id: task._id.toString(), title: task.title, description: task.description,
    status: task.status, priority: task.priority, progress: task.progress,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    assignee: { id: task.assignedTo._id.toString(), name: task.assignedTo.name, email: task.assignedTo.email },
    creator: task.createdBy ? { name: task.createdBy.name } : null
  };
}

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    await connectDB();
    const actor = await User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("role");
    if (!actor) return NextResponse.json({ message: "Account not found." }, { status: 404 });
    const scope = ["owner", "admin"].includes(actor.role) ? { tenantId: auth.tenantId } : { tenantId: auth.tenantId, assignedTo: auth.userId };
    const tasks = await Task.find(scope).populate("assignedTo", "name email").populate("createdBy", "name").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ tasks: tasks.filter(task => task.assignedTo).map(serialize) });
  } catch {
    return NextResponse.json({ message: "Could not load tasks." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    await connectDB();
    const actor = await User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("role");
    if (!actor || !["owner", "admin"].includes(actor.role)) return NextResponse.json({ message: "Only owners and admins can assign tasks." }, { status: 403 });
    const { title, description = "", assignedTo, priority = "medium", dueDate } = await request.json();
    if (!title?.trim() || !assignedTo) return NextResponse.json({ message: "Task title and assignee are required." }, { status: 400 });
    if (!["low", "medium", "high"].includes(priority)) return NextResponse.json({ message: "Invalid priority." }, { status: 400 });
    const assignee = await User.findOne({ _id: assignedTo, tenantId: auth.tenantId }).select("name email");
    if (!assignee) return NextResponse.json({ message: "Assignee is not part of this workspace." }, { status: 400 });
    const task = await Task.create({ title: title.trim(), description: description.trim(), tenantId: auth.tenantId, assignedTo: assignee._id, createdBy: auth.userId, priority, dueDate: dueDate || null });
    const populated = await task.populate([{ path: "assignedTo", select: "name email" }, { path: "createdBy", select: "name" }]);
    return NextResponse.json({ task: serialize(populated) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Could not create task." }, { status: 500 });
  }
}
