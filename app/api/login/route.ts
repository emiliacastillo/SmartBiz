import { NextResponse } from "next/server";

import { appEnv } from "@/lib/env";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  if (email === appEnv.ADMIN_EMAIL && password === appEnv.ADMIN_PASSWORD) {
    await setSessionCookie({ id: "admin-user", email, role: "admin" });
    return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  return NextResponse.redirect(new URL("/login?error=invalid", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
