import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Task from "@/models/Task";

export async function PATCH(request, { params }) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    await connectDB();
    const [actor, { id }, body] = await Promise.all([
      User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("role"), params, request.json()
    ]);
    const task = await Task.findOne({ _id: id, tenantId: auth.tenantId });
    if (!actor || !task) return NextResponse.json({ message: "Task not found." }, { status: 404 });
    const isManager = ["owner", "admin"].includes(actor.role);
    const isAssignee = task.assignedTo.toString() === auth.userId;
    if (!isManager && !isAssignee) return NextResponse.json({ message: "You cannot update this task." }, { status: 403 });

    const statuses = ["todo", "in-progress", "review", "completed"];
    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) return NextResponse.json({ message: "Invalid status." }, { status: 400 });
      task.status = body.status;
      if (body.status === "todo") task.progress = 0;
      if (body.status === "in-progress" && (task.progress === 0 || task.progress === 100)) task.progress = task.progress === 100 ? 90 : 10;
      if (body.status === "review" && task.progress < 90) task.progress = 90;
      if (body.status === "completed") task.progress = 100;
    }
    if (body.progress !== undefined && task.status !== "completed") {
      const progress = Number(body.progress);
      if (!Number.isFinite(progress) || progress < 0 || progress > 100) return NextResponse.json({ message: "Progress must be between 0 and 100." }, { status: 400 });
      task.progress = Math.round(progress);
      if (task.progress === 0) task.status = "todo";
      else if (task.progress === 100) task.status = "completed";
      else if (task.status === "todo") task.status = "in-progress";
    }
    if (isManager && body.priority !== undefined) {
      if (!["low", "medium", "high"].includes(body.priority)) return NextResponse.json({ message: "Invalid priority." }, { status: 400 });
      task.priority = body.priority;
    }
    await task.save();
    return NextResponse.json({ task: { id: task._id.toString(), status: task.status, progress: task.progress, priority: task.priority } });
  } catch {
    return NextResponse.json({ message: "Could not update task." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    await connectDB();
    const actor = await User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("role");
    if (!actor || !["owner", "admin"].includes(actor.role)) return NextResponse.json({ message: "Only owners and admins can delete tasks." }, { status: 403 });
    const { id } = await params;
    const deleted = await Task.findOneAndDelete({ _id: id, tenantId: auth.tenantId });
    if (!deleted) return NextResponse.json({ message: "Task not found." }, { status: 404 });
    return NextResponse.json({ message: "Task deleted." });
  } catch {
    return NextResponse.json({ message: "Could not delete task." }, { status: 500 });
  }
}
