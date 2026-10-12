import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyWinner } from "@/lib/reward-notifications";
const db = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { rewardEntry: db } }));
vi.mock("@/lib/utils", () => ({ getAppUrl: () => "https://example.test" }));
const entry = { id: "entry", status: "AWARDED", publicToken: "a".repeat(64), emailNoticeConsent: true, smsNoticeConsent: true, emailNoticeState: "PENDING", smsNoticeState: "PENDING", contact: { email: "user@example.test", phone: "+13055550101" }, promotion: { title: "Test", active: true, archivedAt: null, business: { name: "Sample", active: true } } };
beforeEach(() => { vi.resetAllMocks(); for (const key of ["RESEND_API_KEY", "REWARDS_EMAIL_FROM", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"]) vi.stubEnv(key, "test"); db.findUnique.mockResolvedValue(entry); db.updateMany.mockResolvedValue({ count: 1 }); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("winner notifications", () => {
  it("uses each provider only with consent, and records acceptance rather than delivery", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", send);
    await notifyWinner("entry"); expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][1].headers["Idempotency-Key"]).toBe("reward-entry");
    expect(db.update).toHaveBeenCalledWith({ where: { id: "entry" }, data: { emailNoticeState: "ACCEPTED" } });
    expect(db.update).toHaveBeenCalledWith({ where: { id: "entry" }, data: { smsNoticeState: "ACCEPTED" } });
  });
  it("does not send when consent or configuration is missing", async () => {
    const send = vi.fn(); vi.stubGlobal("fetch", send); vi.stubEnv("RESEND_API_KEY", ""); db.findUnique.mockResolvedValue({ ...entry, smsNoticeConsent: false });
    await notifyWinner("entry"); expect(send).not.toHaveBeenCalled();
    expect(db.updateMany.mock.calls.map((c) => c[0].data)).toEqual([{ emailNoticeState: "NOT_CONFIGURED" }, { smsNoticeState: "NOT_REQUESTED" }]);
  });
  it("does not duplicate a claimed or accepted notification", async () => {
    const send = vi.fn(); vi.stubGlobal("fetch", send); db.updateMany.mockResolvedValue({ count: 0 }); await notifyWinner("entry"); expect(send).not.toHaveBeenCalled();
  });
  it("marks ambiguous network failures for review instead of blind retries", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Timeout"))); await notifyWinner("entry");
    expect(db.update).toHaveBeenCalledWith({ where: { id: "entry" }, data: { smsNoticeState: "UNKNOWN" } });
    const claim = db.updateMany.mock.calls[1][0].where.smsNoticeState.in; expect(claim).not.toContain("UNKNOWN");
  });
  it("never notifies a redeemed entry or inactive business", async () => {
    vi.stubGlobal("fetch", vi.fn()); db.findUnique.mockResolvedValue({ ...entry, status: "REDEEMED" }); await notifyWinner("entry"); expect(db.updateMany).not.toHaveBeenCalled();
    db.findUnique.mockResolvedValue({ ...entry, promotion: { ...entry.promotion, business: { active: false } } }); await notifyWinner("entry"); expect(db.updateMany).not.toHaveBeenCalled();
  });
});
