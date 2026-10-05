import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/security/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "logged-out",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
