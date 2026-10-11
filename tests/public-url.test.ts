import { afterEach, expect, it, vi } from "vitest";
import { getAppUrl } from "@/lib/utils";

afterEach(() => vi.unstubAllEnvs());

it("uses the canonical domain for production tag links and QR codes despite stale configuration", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("APP_URL", "https://old-deployment.example.test/");
  expect(`${getAppUrl()}/t/ABC123`).toBe("https://smart-biz-rouge.vercel.app/t/ABC123");
});

it("preserves the local development origin without a trailing slash", () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("APP_URL", "http://localhost:3000/");
  expect(getAppUrl()).toBe("http://localhost:3000");
});
