import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/utils";

export function notificationConfiguration() {
  return { email: Boolean(process.env.RESEND_API_KEY && process.env.REWARDS_EMAIL_FROM), sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) };
}
export async function notifyWinner(entryId: string) {
  const entry = await prisma.rewardEntry.findUnique({ where: { id: entryId }, include: { contact: true, promotion: { include: { business: true } } } });
  if (!entry || entry.status !== "AWARDED" || entry.promotion.archivedAt || !entry.promotion.active || !entry.promotion.business.active) return;
  const configured = notificationConfiguration();
  const statusUrl = `${getAppUrl()}/rewards/${entry.publicToken}`;
  const text = `${entry.promotion.business.name}: you received a reward in "${entry.promotion.title}". View your reward, terms and notification preferences: ${statusUrl}`;
  for (const channel of ["email", "sms"] as const) {
    const field = channel === "email" ? "emailNoticeState" : "smsNoticeState";
    const consent = channel === "email" ? entry.emailNoticeConsent : entry.smsNoticeConsent;
    if (!consent || !configured[channel]) {
      await prisma.rewardEntry.updateMany({ where: { id: entryId, [field]: { in: ["PENDING", "NOT_CONFIGURED", "NOT_REQUESTED", "FAILED"] } }, data: { [field]: !consent ? "NOT_REQUESTED" : "NOT_CONFIGURED" } });
      continue;
    }
    // Claim delivery once. Ambiguous network errors are not retried automatically (SMS may have been accepted).
    const claimed = await prisma.rewardEntry.updateMany({ where: { id: entryId, [field]: { in: ["PENDING", "NOT_CONFIGURED", "NOT_REQUESTED", "FAILED"] } }, data: { [field]: "SENDING" } });
    if (!claimed.count) continue;
    let state = "UNKNOWN";
    try {
      const response = channel === "email" ? await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `reward-${entryId}` },
        body: JSON.stringify({ from: process.env.REWARDS_EMAIL_FROM, to: [entry.contact.email], subject: `Your reward from ${entry.promotion.business.name}`, text }), signal: AbortSignal.timeout(10000),
      }) : await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: process.env.TWILIO_FROM_NUMBER!, To: entry.contact.phone, Body: `${text} Reply STOP to opt out.` }), signal: AbortSignal.timeout(10000),
      });
      state = response.ok ? "ACCEPTED" : response.status >= 500 ? "UNKNOWN" : "FAILED";
    } catch { state = "UNKNOWN"; }
    await prisma.rewardEntry.update({ where: { id: entryId }, data: { [field]: state } });
  }
}
