import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/smartbiz?schema=public"),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().default("smartbiz-local-secret"),
  ADMIN_EMAIL: z.string().default("admin@smartbiz.local"),
  ADMIN_PASSWORD: z.string().default("admin123"),
  APP_URL: z.string().default("http://localhost:3000"),
});

export const appEnv = envSchema.parse(process.env);
