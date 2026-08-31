import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { authCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    await connectDB();
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const token = signToken({ userId: user._id.toString(), tenantId: user.tenantId.toString(), role: user.role });
    const response = NextResponse.json({ message: "Logged in." });
    const cookie = authCookie(token);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch {
    return NextResponse.json({ message: "Could not log in." }, { status: 500 });
  }
}
