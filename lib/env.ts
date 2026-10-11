import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/smartbiz?schema=public"),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().default("smartbiz-local-secret"),
  ADMIN_EMAIL: z.string().default("admin@smartbiz.local"),
  ADMIN_PASSWORD: z.string().default("admin123"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_DEMO_MODE: z.string().default("true"),
});

export const appEnv = envSchema.parse({
  ...process.env,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? "true",
});

export function isDemoModeEnabled() {
  return ["true", "1", "yes", "on"].includes((process.env.NEXT_PUBLIC_DEMO_MODE ?? appEnv.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase());
}
