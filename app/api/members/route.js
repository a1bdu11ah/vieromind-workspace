import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { addMember, findUser, findUserByEmail } from "@/lib/data";

export async function POST(request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const actor = await findUser(auth.userId, auth.tenantId);
    if (!actor || !["owner", "admin"].includes(actor.role)) return NextResponse.json({ message: "You do not have permission to add members." }, { status: 403 });

    const { name, email, password, role = "member" } = await request.json();
    if (!name?.trim() || !email?.trim() || !password) return NextResponse.json({ message: "Name, email, and password are required." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
    if (!["member", "admin"].includes(role) || (role === "admin" && actor.role !== "owner")) return NextResponse.json({ message: "That role is not allowed." }, { status: 403 });
    const cleanEmail = email.toLowerCase().trim();
    if (await findUserByEmail(cleanEmail)) return NextResponse.json({ message: "That email already has an account." }, { status: 409 });

    const member = await addMember({ tenantId: auth.tenantId, name: name.trim(), email: cleanEmail, passwordHash: await bcrypt.hash(password, 12), role });
    return NextResponse.json({ member: { id: member.id, name: member.name, email: member.email, role: member.role, joined: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(member.createdAt)) } }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return NextResponse.json({ message: "That email already has an account." }, { status: 409 });
    return NextResponse.json({ message: "Could not add member." }, { status: 500 });
  }
}
