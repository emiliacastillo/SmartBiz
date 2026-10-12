import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRequired, rewardError } from "@/lib/reward-api";
import { awardEntry, redeemEntry, RewardError } from "@/lib/rewards";
import { notifyWinner } from "@/lib/reward-notifications";
import { prisma } from "@/lib/prisma";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("award"), entryId: z.string().min(1) }),
  z.object({ action: z.literal("draw") }),
  z.object({ action: z.literal("notify"), entryId: z.string().min(1) }),
  z.object({ action: z.literal("redeem"), code: z.string().min(1).max(100), serviceId: z.string().min(1) }),
]);
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await adminRequired(); const { id } = await params; const data = schema.parse(await request.json());
    if (data.action === "redeem") await redeemEntry(id, data.code, data.serviceId);
    else if (data.action === "notify") {
      if (!await prisma.rewardEntry.findFirst({ where: { id: data.entryId, promotionId: id } })) throw new RewardError("Entry not found", 404);
      await notifyWinner(data.entryId);
    } else { const entry = await awardEntry(id, data.action === "award" ? data.entryId : undefined); await notifyWinner(entry.id); }
    return NextResponse.json({ success: true });
  } catch (e) { return rewardError(e); }
}
