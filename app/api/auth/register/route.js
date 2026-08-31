import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { authCookie, signToken } from "@/lib/auth";
import Tenant from "@/models/Tenant";
import User from "@/models/User";

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

    await connectDB();
    const cleanEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: cleanEmail })) {
      return NextResponse.json({ message: "Email already registered." }, { status: 409 });
    }

    const baseSlug = slugify(organization) || "workspace";
    let slug = baseSlug;
    let suffix = 1;
    while (await Tenant.findOne({ slug })) slug = `${baseSlug}-${suffix++}`;

    const tenant = await Tenant.create({ name: organization.trim(), slug });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(), email: cleanEmail, password: hashedPassword,
      tenantId: tenant._id, role: "owner"
    });

    const token = signToken({ userId: user._id.toString(), tenantId: tenant._id.toString(), role: user.role });
    const response = NextResponse.json({ message: "Workspace created." }, { status: 201 });
    const cookie = authCookie(token);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Could not create account." }, { status: 500 });
  }
}
