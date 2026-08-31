import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findMember, findUser, removeMember, updateMemberRole } from "@/lib/data";

async function ownerContext() {
  const auth = await getCurrentUser();
  if (!auth) return {};
  const actor = await findUser(auth.userId, auth.tenantId);
  return { auth, actor };
}

export async function PATCH(request, { params }) {
  try {
    const { auth, actor } = await ownerContext();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    if (actor?.role !== "owner") return NextResponse.json({ message: "Only the owner can change roles." }, { status: 403 });
    const { id } = await params;
    const { role } = await request.json();
    if (!["member", "admin"].includes(role)) return NextResponse.json({ message: "Invalid role." }, { status: 400 });
    const member = await findMember(id, auth.tenantId);
    if (!member) return NextResponse.json({ message: "Member not found." }, { status: 404 });
    if (member.role === "owner") return NextResponse.json({ message: "The workspace owner role cannot be changed." }, { status: 400 });
    await updateMemberRole(id, auth.tenantId, role);
    return NextResponse.json({ message: "Role updated." });
  } catch {
    return NextResponse.json({ message: "Could not update role." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { auth, actor } = await ownerContext();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    if (actor?.role !== "owner") return NextResponse.json({ message: "Only the owner can remove members." }, { status: 403 });
    const { id } = await params;
    if (id === auth.userId) return NextResponse.json({ message: "You cannot remove yourself." }, { status: 400 });
    const member = await findMember(id, auth.tenantId);
    if (!member) return NextResponse.json({ message: "Member not found." }, { status: 404 });
    if (member.role === "owner") return NextResponse.json({ message: "The workspace owner cannot be removed." }, { status: 400 });
    await removeMember(id, auth.tenantId);
    return NextResponse.json({ message: "Member removed." });
  } catch {
    return NextResponse.json({ message: "Could not remove member." }, { status: 500 });
  }
}
