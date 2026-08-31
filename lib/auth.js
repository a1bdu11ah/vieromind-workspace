import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "viero_token";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function signToken(payload) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!UUID_PATTERN.test(payload.userId) || !UUID_PATTERN.test(payload.tenantId)) return null;
    if (!["owner", "admin", "member"].includes(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

export function authCookie(token) {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    }
  };
}

export const authCookieName = COOKIE_NAME;
