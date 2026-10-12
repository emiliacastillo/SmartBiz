import { randomBytes, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { campaignAvailable, campaignSchema, entrySchema } from "@/lib/reward-validation";
import type { Prisma } from "@prisma/client";

export class RewardError extends Error { constructor(message: string, public status = 400) { super(message); } }
const include = { entries: { include: { contact: true }, orderBy: { createdAt: "desc" as const } }, _count: { select: { entries: true } } };
export async function listCampaigns(businessId: string) {
  return prisma.promotion.findMany({ where: { businessId, archivedAt: null }, orderBy: { createdAt: "desc" }, include });
}
async function lock(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Promotion" WHERE id = ${id} FOR UPDATE`;
}
export async function saveCampaign(businessId: string, input: unknown, id?: string) {
  const data = campaignSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    if (id) {
      await lock(tx, id);
      const existing = await tx.promotion.findFirst({ where: { id, businessId, archivedAt: null } });
      if (!existing) throw new RewardError("Campaign not found", 404);
      const awarded = await tx.rewardEntry.count({ where: { promotionId: id, status: { in: ["AWARDED", "REDEEMED"] } } });
      const entered = await tx.rewardEntry.count({ where: { promotionId: id } });
      if (awarded > data.winnerLimit || entered > data.entryLimit) throw new RewardError("Limits cannot be lower than existing awards or entries");
    }
    const count = await tx.businessLink.count({ where: { id: { in: data.serviceIds }, businessId, active: true } });
    if (count !== data.serviceIds.length) throw new RewardError("Choose active services from this business");
    const fields = { ...data, startsAt: data.startsAt ? new Date(data.startsAt) : null, endsAt: data.endsAt ? new Date(data.endsAt) : null, redemptionEndsAt: data.redemptionEndsAt ? new Date(data.redemptionEndsAt) : null };
    return id ? tx.promotion.update({ where: { id }, data: fields }) : tx.promotion.create({ data: { ...fields, businessId } });
  });
}
export async function enterCampaign(id: string, input: unknown) {
  const data = entrySchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await lock(tx, id);
    const campaign = await tx.promotion.findUnique({ where: { id }, include: { business: true } });
    if (!campaign || !campaign.business.active || !campaignAvailable(campaign) || !campaign.entryEnabled) throw new RewardError("This campaign is not accepting entries", 409);
    const tag = await tx.smartTag.findFirst({ where: { code: data.tagCode.toUpperCase(), active: true, businessId: campaign.businessId } });
    if (!tag) throw new RewardError("Invalid business tag", 400);
    if (await tx.rewardEntry.count({ where: { promotionId: id } }) >= campaign.entryLimit) throw new RewardError("This campaign is full", 409);
    const existing = await tx.customerContact.findUnique({ where: { businessId_email: { businessId: campaign.businessId, email: data.email } } });
    if (existing && await tx.rewardEntry.findUnique({ where: { promotionId_contactId: { promotionId: id, contactId: existing.id } } })) throw new RewardError("An entry already exists. Use the private status link saved when you entered.", 409);
    // Existing contact details and marketing permissions are not changed by an unauthenticated new entry.
    const contact = existing ?? await tx.customerContact.create({ data: { businessId: campaign.businessId, name: data.name, email: data.email, phone: data.phone, emailMarketingConsent: data.emailMarketingConsent, smsMarketingConsent: data.smsMarketingConsent } });
    if (existing && (existing.phone !== data.phone || existing.name !== data.name)) throw new RewardError("Contact details do not match the existing profile. Contact the business.", 409);
    const awarded = campaign.awardMode === "INSTANT";
    if (awarded && await tx.rewardEntry.count({ where: { promotionId: id, status: { in: ["AWARDED", "REDEEMED"] } } }) >= campaign.winnerLimit) throw new RewardError("All rewards have been claimed", 409);
    return tx.rewardEntry.create({ data: {
      promotionId: id, contactId: contact.id, publicToken: randomBytes(32).toString("hex"), redemptionCode: randomBytes(12).toString("hex").toUpperCase(),
      termsSnapshot: campaign.terms, serviceIds: campaign.serviceIds, emailNoticeConsent: data.emailNoticeConsent, smsNoticeConsent: data.smsNoticeConsent,
      status: awarded ? "AWARDED" : "PENDING", awardedAt: awarded ? new Date() : null,
    } });
  });
}
export async function awardEntry(promotionId: string, entryId?: string) {
  return prisma.$transaction(async (tx) => {
    await lock(tx, promotionId);
    const campaign = await tx.promotion.findUnique({ where: { id: promotionId }, include: { business: true } });
    if (!campaign || !campaign.business.active || !campaign.active || campaign.archivedAt) throw new RewardError("Campaign is inactive", 409);
    if (campaign.startsAt && campaign.startsAt > new Date() || campaign.redemptionEndsAt && campaign.redemptionEndsAt <= new Date()) throw new RewardError("Campaign is not eligible for awards", 409);
    if (await tx.rewardEntry.count({ where: { promotionId, status: { in: ["AWARDED", "REDEEMED"] } } }) >= campaign.winnerLimit) throw new RewardError("Winner limit reached", 409);
    const pending = await tx.rewardEntry.findMany({ where: { promotionId, status: "PENDING", ...(entryId ? { id: entryId } : {}) }, select: { id: true } });
    if (!pending.length) throw new RewardError("No eligible pending entries", 409);
    const chosen = pending[entryId ? 0 : randomInt(pending.length)];
    return tx.rewardEntry.update({ where: { id: chosen.id }, data: { status: "AWARDED", awardedAt: new Date() } });
  });
}
export async function redeemEntry(promotionId: string, code: string, serviceId: string) {
  return prisma.$transaction(async (tx) => {
    await lock(tx, promotionId);
    const campaign = await tx.promotion.findUnique({ where: { id: promotionId }, include: { business: true } });
    if (!campaign || !campaign.active || campaign.archivedAt || !campaign.business.active || campaign.redemptionEndsAt && campaign.redemptionEndsAt <= new Date()) throw new RewardError("Redemption is closed", 409);
    const entry = await tx.rewardEntry.findUnique({ where: { redemptionCode: code.trim().toUpperCase() } });
    if (!entry || entry.promotionId !== promotionId || entry.status !== "AWARDED") throw new RewardError("Invalid or already redeemed reward", 409);
    if (!entry.serviceIds.includes(serviceId) || !await tx.businessLink.findFirst({ where: { id: serviceId, businessId: campaign.businessId, active: true } })) throw new RewardError("This service is not eligible", 400);
    return tx.rewardEntry.update({ where: { id: entry.id }, data: { status: "REDEEMED", redeemedAt: new Date(), redeemedServiceId: serviceId } });
  });
}
