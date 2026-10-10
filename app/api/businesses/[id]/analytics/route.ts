import { NextResponse } from "next/server";

import { aggregateBusinessAnalytics } from "@/lib/analytics";
import { getSessionUser } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  return NextResponse.json(aggregateBusinessAnalytics(id));
}
