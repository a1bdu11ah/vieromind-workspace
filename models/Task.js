import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["todo", "in-progress", "review", "completed"], default: "todo", index: true },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

TaskSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
