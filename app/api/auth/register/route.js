import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authCookie, signToken } from "@/lib/auth";
import { createWorkspaceOwner, findAvailableSlug, findUserByEmail } from "@/lib/data";

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request) {
  try {
    const { name, email, password, organization } = await request.json();
    if (!name || !email || !password || !organization) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (await findUserByEmail(cleanEmail)) {
      return NextResponse.json({ message: "Email already registered." }, { status: 409 });
    }

    const baseSlug = slugify(organization) || "workspace";
    const slug = await findAvailableSlug(baseSlug);
    const hashedPassword = await bcrypt.hash(password, 12);
    const { user, tenant } = await createWorkspaceOwner({
      name: name.trim(), email: cleanEmail, passwordHash: hashedPassword,
      organization: organization.trim(), slug
    });

    const token = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });
    const response = NextResponse.json({ message: "Workspace created." }, { status: 201 });
    const cookie = authCookie(token);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return NextResponse.json({ message: "That email or workspace URL is already registered." }, { status: 409 });
    return NextResponse.json({ message: "Could not create account." }, { status: 500 });
  }
}
