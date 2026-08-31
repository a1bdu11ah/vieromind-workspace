import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authCookie, signToken } from "@/lib/auth";
import { findUserByEmail } from "@/lib/data";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = email?.toLowerCase().trim();
    if (!cleanEmail || !password) return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    const user = await findUserByEmail(cleanEmail);
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const token = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role });
    const response = NextResponse.json({ message: "Logged in." });
    const cookie = authCookie(token);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("Login failed:", error.message);
    return NextResponse.json({ message: "Could not log in." }, { status: 500 });
  }
}
