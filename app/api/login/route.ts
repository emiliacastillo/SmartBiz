import { NextResponse } from "next/server";

import { appEnv } from "@/lib/env";
import { setSessionCookie } from "@/lib/session";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url), 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  if (appEnv.ADMIN_EMAIL && appEnv.ADMIN_PASSWORD && email === appEnv.ADMIN_EMAIL && password === appEnv.ADMIN_PASSWORD) {
    await setSessionCookie({ id: "admin-user", email, role: "admin" });
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  }

  return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
}
