import { describe, expect, it } from "vitest";
import { campaignAvailable, campaignSchema, entrySchema } from "@/lib/reward-validation";
const campaign = { title: "Free assembly", kind: "REWARD", terms: "One furniture assembly per winner.", active: true, entryEnabled: true, awardMode: "MANUAL", winnerLimit: 1, entryLimit: 10, serviceIds: ["assembly"] };
describe("reward validation", () => {
  it("requires terms, sensible capacity and unique services", () => {
    expect(campaignSchema.safeParse(campaign).success).toBe(true);
    for (const change of [{ terms: "" }, { winnerLimit: 11 }, { serviceIds: ["assembly", "assembly"] }]) expect(campaignSchema.safeParse({ ...campaign, ...change }).success).toBe(false);
  });
  it("rejects inverted campaign and redemption windows", () => {
    expect(campaignSchema.safeParse({ ...campaign, startsAt: "2026-10-20T00:00:00Z", endsAt: "2026-10-19T00:00:00Z" }).success).toBe(false);
    expect(campaignSchema.safeParse({ ...campaign, startsAt: "2026-10-20T00:00:00Z", redemptionEndsAt: "2026-10-19T00:00:00Z" }).success).toBe(false);
    expect(campaignSchema.safeParse({ ...campaign, endsAt: "2026-10-20T00:00:00Z", redemptionEndsAt: "2026-10-19T00:00:00Z" }).success).toBe(false);
  });
  it("honors activation, archival and exact date boundaries", () => {
    const now = new Date("2026-10-11T12:00:00Z"); const base = { active: true, startsAt: now, endsAt: null };
    expect(campaignAvailable(base, now)).toBe(true);
    for (const change of [{ active: false }, { archivedAt: now }, { endsAt: now }, { startsAt: new Date(now.getTime() + 1) }]) expect(campaignAvailable({ ...base, ...change }, now)).toBe(false);
  });
  it("normalizes contacts and never implies notification or marketing consent", () => {
    const input = { name: "Test Visitor", email: " USER@EXAMPLE.COM ", phone: "+13055550101", acceptTerms: true, tagCode: "MIAMI" };
    const entry = entrySchema.parse(input);
    expect(entry.email).toBe("user@example.com");
    for (const key of ["emailNoticeConsent", "smsNoticeConsent", "emailMarketingConsent", "smsMarketingConsent"] as const) expect(entry[key]).toBe(false);
    expect(entrySchema.safeParse({ ...input, acceptTerms: false }).success).toBe(false);
    expect(entrySchema.safeParse({ ...input, phone: "555-123" }).success).toBe(false);
  });
});
