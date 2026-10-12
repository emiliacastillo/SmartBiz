import { NextResponse } from "next/server";
import { adminRequired, rewardError } from "@/lib/reward-api";
import { listCampaigns, saveCampaign, RewardError } from "@/lib/rewards";
import { prisma } from "@/lib/prisma";
import { notificationConfiguration } from "@/lib/reward-notifications";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try { await adminRequired(); const { id } = await params; return NextResponse.json({ campaigns: await listCampaigns(id), notifications: notificationConfiguration() }, { headers: { "Cache-Control": "no-store" } }); } catch (e) { return rewardError(e); }
}
export async function POST(request: Request, { params }: Context) {
  try {
    await adminRequired(); const { id } = await params;
    if (!await prisma.business.findUnique({ where: { id } })) throw new RewardError("Business not found", 404);
    return NextResponse.json(await saveCampaign(id, await request.json()), { status: 201 });
  } catch (e) { return rewardError(e); }
}
