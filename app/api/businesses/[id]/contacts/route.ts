import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminRequired, rewardError } from "@/lib/reward-api";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await adminRequired(); const { id } = await params;
    const contacts = await prisma.customerContact.findMany({ where: { businessId: id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, phone: true, emailMarketingConsent: true, smsMarketingConsent: true, consentUpdatedAt: true } });
    return NextResponse.json(contacts, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return rewardError(e); }
}
