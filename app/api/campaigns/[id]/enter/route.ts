import { NextResponse } from "next/server";
import { enterCampaign } from "@/lib/rewards";
import { rewardError } from "@/lib/reward-api";
import { notifyWinner } from "@/lib/reward-notifications";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const entry = await enterCampaign(id, await request.json());
    if (entry.status === "AWARDED") await notifyWinner(entry.id);
    return NextResponse.json({ status: entry.status, statusUrl: `/rewards/${entry.publicToken}` }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) { return rewardError(e); }
}
