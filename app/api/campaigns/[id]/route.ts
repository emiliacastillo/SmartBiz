import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminRequired, rewardError } from "@/lib/reward-api";
import { saveCampaign, RewardError } from "@/lib/rewards";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    await adminRequired(); const { id } = await params;
    const campaign = await prisma.promotion.findUnique({ where: { id } });
    if (!campaign) throw new RewardError("Campaign not found", 404);
    return NextResponse.json(await saveCampaign(campaign.businessId, await request.json(), id));
  } catch (e) { return rewardError(e); }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    await adminRequired(); const { id } = await params;
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Promotion" WHERE id = ${id} FOR UPDATE`;
      await tx.promotion.update({ where: { id }, data: { active: false, archivedAt: new Date() } });
    });
    return NextResponse.json({ success: true });
  } catch (e) { return rewardError(e); }
}
