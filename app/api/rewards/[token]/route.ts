import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rewardError } from "@/lib/reward-api";
import { z } from "zod";
type Context = { params: Promise<{ token: string }> };
export async function GET(_request: Request, { params }: Context) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const entry = await prisma.rewardEntry.findUnique({ where: { publicToken: token }, include: { promotion: { include: { business: true } }, contact: true } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const services = await prisma.businessLink.findMany({ where: { id: { in: entry.serviceIds }, businessId: entry.promotion.businessId, active: true }, select: { id: true, label: true } });
  const available = entry.promotion.active && entry.promotion.business.active && !entry.promotion.archivedAt && (!entry.promotion.redemptionEndsAt || entry.promotion.redemptionEndsAt > new Date());
  return NextResponse.json({
    title: entry.promotion.title, business: entry.promotion.business.name, status: entry.status,
    terms: entry.termsSnapshot, code: entry.status === "AWARDED" && available ? entry.redemptionCode : null,
    redemptionEndsAt: entry.promotion.redemptionEndsAt, available, services,
    emailMarketingConsent: entry.contact.emailMarketingConsent, smsMarketingConsent: entry.contact.smsMarketingConsent,
    emailNoticeConsent: entry.emailNoticeConsent, smsNoticeConsent: entry.smsNoticeConsent,
  }, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { token } = await params;
    const data = z.object({ emailMarketingConsent: z.boolean(), smsMarketingConsent: z.boolean(), emailNoticeConsent: z.boolean(), smsNoticeConsent: z.boolean() }).parse(await request.json());
    const entry = await prisma.rewardEntry.findUnique({ where: { publicToken: token } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.$transaction([
      prisma.customerContact.update({ where: { id: entry.contactId }, data: { emailMarketingConsent: data.emailMarketingConsent, smsMarketingConsent: data.smsMarketingConsent, consentUpdatedAt: new Date() } }),
      prisma.rewardEntry.update({ where: { id: entry.id }, data: { emailNoticeConsent: data.emailNoticeConsent, smsNoticeConsent: data.smsNoticeConsent } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (e) { return rewardError(e); }
}
