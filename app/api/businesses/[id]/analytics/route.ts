import { NextResponse } from "next/server";

import { aggregateBusinessAnalytics } from "@/lib/analytics";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (session.role !== "admin" && session.businessId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = Number(new URL(request.url).searchParams.get("days") ?? 30);
  if (![7, 30, 90].includes(days)) {
    return NextResponse.json({ error: "Days must be 7, 30, or 90" }, { status: 400 });
  }

  const analytics = await aggregateBusinessAnalytics(id, days);
  return NextResponse.json(analytics, { headers: { "Cache-Control": "private, no-store" } });
}
