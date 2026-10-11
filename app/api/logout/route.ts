import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/session";

export async function GET() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"));
}
