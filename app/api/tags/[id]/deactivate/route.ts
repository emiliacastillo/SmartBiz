import { NextResponse } from "next/server";

import { getDemoStore, updateTag } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tag = getDemoStore().tags.find((item) => item.id === id);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const updated = updateTag(id, { active: false });
  return NextResponse.json(updated);
}
