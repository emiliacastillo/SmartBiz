import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "business";
  businessId?: string;
};

const SESSION_COOKIE = "smartbiz_session";
const DEFAULT_SECRET = "smartbiz-demo-secret";

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSecret() {
  return process.env.AUTH_SECRET ?? DEFAULT_SECRET;
}

function signData(payload: Record<string, unknown>) {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
  return `${base64UrlEncode(data)}.${signature}`;
}

function verifySignature(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Record<string, unknown>;
    const expected = createHmac("sha256", getSecret())
      .update(base64UrlDecode(encodedPayload))
      .digest("base64url");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(user: SessionUser) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId ?? null,
    exp: Date.now() + 1000 * 60 * 60 * 8,
    iat: Date.now(),
  };

  return signData(payload);
}

export function verifySessionToken(token?: string): SessionUser | null {
  if (!token) return null;

  const payload = verifySignature(token);
  if (!payload || typeof payload.exp !== "number") return null;
  if (Date.now() > Number(payload.exp)) return null;

  return {
    id: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    role: payload.role === "admin" ? "admin" : "business",
    businessId: payload.businessId ? String(payload.businessId) : undefined,
  };
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = verifySessionToken(token);
  if (!user || !user.email) return null;
  return user;
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function requireAdminSession(user: SessionUser | null) {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export function requireBusinessSession(user: SessionUser | null, businessId?: string) {
  if (!user) throw new Error("Unauthorized");
  if (user.role === "admin") return;
  if (businessId && user.businessId && user.businessId === businessId) return;
  if (!businessId && user.businessId) return;
  throw new Error("Forbidden");
}
