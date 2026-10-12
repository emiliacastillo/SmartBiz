import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/smartbiz?schema=public"),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().default(""),
  ADMIN_PASSWORD: z.string().default(""),
  APP_URL: z.string().default("http://localhost:3000"),
});

export const appEnv = envSchema.parse(process.env);
