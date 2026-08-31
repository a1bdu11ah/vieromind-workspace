import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    await connectDB();
    const actor = await User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("role");
    if (!actor || !["owner", "admin"].includes(actor.role)) return NextResponse.json({ message: "You do not have permission to add members." }, { status: 403 });

    const { name, email, password, role = "member" } = await request.json();
    if (!name?.trim() || !email?.trim() || !password) return NextResponse.json({ message: "Name, email, and password are required." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
    if (!["member", "admin"].includes(role) || (role === "admin" && actor.role !== "owner")) return NextResponse.json({ message: "That role is not allowed." }, { status: 403 });
    const cleanEmail = email.toLowerCase().trim();
    if (await User.exists({ email: cleanEmail })) return NextResponse.json({ message: "That email already has an account." }, { status: 409 });

    const member = await User.create({ name: name.trim(), email: cleanEmail, password: await bcrypt.hash(password, 12), tenantId: auth.tenantId, role });
    return NextResponse.json({ member: { id: member._id.toString(), name: member.name, email: member.email, role: member.role, joined: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(member.createdAt) } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Could not add member." }, { status: 500 });
  }
}
