import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RewardError } from "@/lib/rewards";
import { getSessionUser } from "@/lib/session";

export async function adminRequired() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") throw new RewardError("Unauthorized", 401);
}
export function rewardError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(". ") }, { status: 400 });
  if (error instanceof RewardError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "An entry or contact already exists. Please check your private entry link." }, { status: 409 });
  return NextResponse.json({ error: "Unable to complete this request. Please try again." }, { status: 500 });
}
