import { z } from "zod";
const date = z.string().datetime().nullable().optional();
const webUrl = z.string().max(2000).refine((v) => !v || /^https?:\/\//.test(v) && URL.canParse(v), "Use an HTTP or HTTPS URL");
export const campaignSchema = z.object({
  title: z.string().trim().min(2).max(120), description: z.string().max(3000).nullish().transform((v) => v ?? ""),
  kind: z.enum(["PROMOTION", "REWARD", "EVENT"]), terms: z.string().trim().max(6000).default(""),
  active: z.boolean(), entryEnabled: z.boolean(), awardMode: z.enum(["MANUAL", "INSTANT"]),
  winnerLimit: z.number().int().min(1).max(10000), entryLimit: z.number().int().min(1).max(10000),
  serviceIds: z.array(z.string().min(1)).max(100).refine((ids) => new Set(ids).size === ids.length),
  startsAt: date, endsAt: date, redemptionEndsAt: date,
  destinationUrl: webUrl.nullish().transform((v) => v ?? ""),
}).refine((v) => !v.entryEnabled || v.terms.length >= 10, "Provide participation and redemption terms")
  .refine((v) => !v.startsAt || !v.endsAt || new Date(v.startsAt) < new Date(v.endsAt), "End date must follow the start")
  .refine((v) => !v.endsAt || !v.redemptionEndsAt || new Date(v.endsAt) <= new Date(v.redemptionEndsAt), "Redemption must remain available until entries close")
  .refine((v) => !v.startsAt || !v.redemptionEndsAt || new Date(v.startsAt) < new Date(v.redemptionEndsAt), "Redemption must end after the campaign starts")
  .refine((v) => v.winnerLimit <= v.entryLimit, "Winner limit cannot exceed entry limit");

export const entrySchema = z.object({
  name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Use an international phone number, for example +13055550101"),
  acceptTerms: z.literal(true), tagCode: z.string().min(1).max(20),
  emailNoticeConsent: z.boolean().default(false), smsNoticeConsent: z.boolean().default(false),
  emailMarketingConsent: z.boolean().default(false), smsMarketingConsent: z.boolean().default(false),
});

export function campaignAvailable(c: { active: boolean; archivedAt?: Date | null; startsAt: Date | null; endsAt: Date | null }, now = new Date()) {
  return c.active && !c.archivedAt && (!c.startsAt || c.startsAt <= now) && (!c.endsAt || c.endsAt > now);
}
