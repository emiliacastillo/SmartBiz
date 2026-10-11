import { z } from "zod";

export const businessSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(60).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(250).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const tagSchema = z.object({
  code: z.string().min(4).max(12).optional(),
  name: z.string().min(2).max(80).optional(),
  location: z.string().max(120).optional().or(z.literal("")),
  active: z.boolean().optional(),
  businessId: z.string().min(1),
});

export const linkSchema = z.object({
  businessId: z.string().min(1),
  type: z.enum([
    "MENU",
    "REVIEWS",
    "INSTAGRAM",
    "FACEBOOK",
    "RESERVATION",
    "BOOKING",
    "WEBSITE",
    "WHATSAPP",
    "PHONE",
    "CUSTOM",
  ]),
  label: z.string().min(1).max(80),
  url: z.string().min(1).max(500),
  icon: z.string().max(40).optional().or(z.literal("")),
  position: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const smartTagLinkAssignmentSchema = z.object({
  linkIds: z.array(z.string().min(1)).max(100).refine((ids) => new Set(ids).size === ids.length),
});
