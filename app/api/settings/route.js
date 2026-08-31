import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import Tenant from "@/models/Tenant";

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function PATCH(request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    await connectDB();
    const actor = await User.findOne({ _id: auth.userId, tenantId: auth.tenantId }).select("role");
    if (!actor || !["owner", "admin"].includes(actor.role)) return NextResponse.json({ message: "You do not have permission to edit workspace settings." }, { status: 403 });
    const { name, slug } = await request.json();
    const cleanName = name?.trim();
    const cleanSlug = slugify(slug || "");
    if (!cleanName || cleanName.length > 80) return NextResponse.json({ message: "Enter a workspace name under 80 characters." }, { status: 400 });
    if (cleanSlug.length < 3 || cleanSlug.length > 50) return NextResponse.json({ message: "The workspace URL must be 3–50 characters." }, { status: 400 });
    if (await Tenant.exists({ slug: cleanSlug, _id: { $ne: auth.tenantId } })) return NextResponse.json({ message: "That workspace URL is already taken." }, { status: 409 });
    const tenant = await Tenant.findByIdAndUpdate(auth.tenantId, { name: cleanName, slug: cleanSlug }, { new: true, runValidators: true }).select("name slug").lean();
    if (!tenant) return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    return NextResponse.json({ tenant: { name: tenant.name, slug: tenant.slug } });
  } catch {
    return NextResponse.json({ message: "Could not save workspace settings." }, { status: 500 });
  }
}
