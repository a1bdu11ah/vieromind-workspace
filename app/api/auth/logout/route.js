import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(authCookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
