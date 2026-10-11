import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Business, Prisma } from "@prisma/client";

import AdminPage from "@/app/admin/page";
import HomePage from "@/app/page";
import { GET as listBusinesses, POST as createBusiness } from "@/app/api/businesses/route";
import { GET as openLogin, POST as login } from "@/app/api/login/route";
import { POST as logout } from "@/app/api/logout/route";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionUser } from "@/lib/session";

const state = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  setCookie: vi.fn(),
  findBusinesses: vi.fn<() => Promise<Business[]>>(),
  createBusiness: vi.fn<(args: Prisma.BusinessCreateArgs) => Promise<Business>>(),
}));

// Keep the real signing, authorization, handlers, data-store queries, and page rendering.
// Only the framework request context and database boundary are simulated.
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (name: string) => state.cookies.has(name) ? { value: state.cookies.get(name) } : undefined,
  set: (name: string, value: string, options: unknown) => {
    state.cookies.set(name, value);
    state.setCookie(name, value, options);
  },
  delete: (name: string) => state.cookies.delete(name),
}) }));
vi.mock("next/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/server")>(),
  connection: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); },
}));
vi.mock("@/components/admin-crud-controls", () => ({ BusinessAdministrationControls: () => null }));
vi.mock("@/components/platform-admin-manager", () => ({ BusinessTagManager: () => null, CreateBusinessForm: () => null }));
vi.mock("@/lib/env", () => ({ appEnv: { ADMIN_EMAIL: "admin@example.test", ADMIN_PASSWORD: "test-password" } }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  business: { findMany: state.findBusinesses, create: state.createBusiness },
  smartTag: { findMany: vi.fn() },
  businessLink: { findMany: vi.fn() },
  smartTagLink: { findMany: vi.fn() },
  promotion: { findMany: vi.fn() },
  interaction: { count: vi.fn() },
} }));

let businesses: Business[];
const origin = "https://current-deployment.example.test";
function loginRequest(password = "test-password") {
  return new Request(`${origin}/api/login`, {
    method: "POST",
    body: new URLSearchParams({ email: "admin@example.test", password }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  state.cookies.clear();
  vi.stubEnv("AUTH_SECRET", "session-test-secret");
  vi.stubEnv("APP_URL", "https://old-deployment.example.test");
  businesses = [{
    id: "existing", name: "Existing business", slug: "existing", description: "",
    logoUrl: null, primaryColor: "#000000", secondaryColor: "#ffffff",
    phone: "", address: "", website: "", active: false,
    createdAt: new Date(), updatedAt: new Date(),
  }];
  state.findBusinesses.mockImplementation(async () => [...businesses]);
  state.createBusiness.mockImplementation(async ({ data }) => {
    const row = { ...businesses[0], ...data, id: "new-business" } as Business;
    businesses.push(row);
    return row;
  });
  vi.mocked(prisma.smartTag.findMany).mockResolvedValue([]);
  vi.mocked(prisma.businessLink.findMany).mockResolvedValue([]);
  vi.mocked(prisma.smartTagLink.findMany).mockResolvedValue([]);
  vi.mocked(prisma.promotion.findMany).mockResolvedValue([]);
  vi.mocked(prisma.interaction.count).mockResolvedValue(0);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("admin data and session regression", () => {
  it("shows a newly created business on both pages and subsequent admin refreshes", async () => {
    await login(loginRequest());
    const token = state.cookies.get("smartbiz_session");
    const before = renderToStaticMarkup(await AdminPage());
    expect(before).toContain("Existing business");
    expect(before).not.toContain("Newly created business");

    const created = await createBusiness(new Request(`${origin}/api/businesses`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Newly created business" }),
    }));
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({ id: "new-business" });

    for (let refresh = 0; refresh < 2; refresh++) {
      const html = renderToStaticMarkup(await AdminPage());
      expect(html).toContain("Newly created business");
      expect(html).toContain("Existing business");
      expect(state.cookies.get("smartbiz_session")).toBe(token);
      expect(await getSessionUser()).toMatchObject({ role: "admin" });
    }
    const home = renderToStaticMarkup(await HomePage());
    expect(home).toContain("Newly created business");
    expect(home).toContain("Existing business");
    expect(await (await listBusinesses()).json()).toHaveLength(2);
    expect(prisma.business.findMany).toHaveBeenCalledTimes(5);
    for (const [query] of vi.mocked(prisma.business.findMany).mock.calls) {
      expect(query).toEqual({ orderBy: { createdAt: "asc" } });
    }
  });

  it.each(["anonymous", "business"])("blocks %s users before reading or creating businesses", async (role) => {
    if (role === "business") state.cookies.set("smartbiz_session", createSessionToken({
      id: "owner", email: "owner@example.test", role: "business", businessId: "existing",
    }));
    await expect(AdminPage()).rejects.toThrow("REDIRECT:/login");
    expect((await listBusinesses()).status).toBe(401);
    expect((await createBusiness(new Request(`${origin}/api/businesses`, { method: "POST" }))).status).toBe(401);
    expect(prisma.business.findMany).not.toHaveBeenCalled();
    expect(prisma.business.create).not.toHaveBeenCalled();
  });

  it("redirects successful login with GET on the same origin and sets a persistent secure cookie", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await login(loginRequest());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/admin`);
    expect(state.setCookie).toHaveBeenCalledWith("smartbiz_session", expect.any(String), {
      httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 28800,
    });
  });

  it("redirects invalid login on the same origin without setting a session", async () => {
    const response = await login(loginRequest("wrong-password"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/login?error=invalid`);
    expect(state.setCookie).not.toHaveBeenCalled();
  });

  it("handles direct GET login navigation without authenticating", async () => {
    const response = await openLogin(new Request(`${origin}/api/login`));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/login`);
    expect(await getSessionUser()).toBeNull();
    expect(state.setCookie).not.toHaveBeenCalled();
  });

  it("keeps sessions valid on refresh but rejects expired and tampered cookies", async () => {
    vi.useFakeTimers();
    await login(loginRequest());
    const token = state.cookies.get("smartbiz_session")!;
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(await getSessionUser()).toMatchObject({ role: "admin" });
    state.cookies.set("smartbiz_session", `${token}tampered`);
    await expect(AdminPage()).rejects.toThrow("REDIRECT:/login");
    state.cookies.set("smartbiz_session", token);
    vi.advanceTimersByTime(8 * 60 * 60 * 1000);
    await expect(AdminPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("signs out by explicit POST and redirects within the current deployment", async () => {
    await login(loginRequest());
    const html = renderToStaticMarkup(await AdminPage());
    expect(html).toMatch(/<form[^>]*action="\/api\/logout"[^>]*method="POST"/);
    expect(html).not.toContain('href="/api/logout"');
    const response = await logout(new Request(`${origin}/api/logout`, { method: "POST" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/login`);
    await expect(AdminPage()).rejects.toThrow("REDIRECT:/login");
  });
});
