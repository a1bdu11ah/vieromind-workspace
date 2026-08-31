import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  role: { type: String, enum: ["owner", "admin", "member"], default: "owner" }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
