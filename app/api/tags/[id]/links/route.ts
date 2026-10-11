import { NextResponse } from "next/server";

import { getDemoStore, setSmartTagLinkAssignments } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";
import { smartTagLinkAssignmentSchema } from "@/lib/validators";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const store = await getDemoStore();
  const tag = store.tags.find((item) => item.id === id && item.active);
  if (!tag) return NextResponse.json({ error: "Active tag not found" }, { status: 404 });

  const links = store.links.filter((link) => link.businessId === tag.businessId && link.active);
  const assignedLinkIds = store.tagLinkAssignments
    .filter((assignment) => assignment.smartTagId === tag.id)
    .map((assignment) => assignment.businessLinkId);

  return NextResponse.json({ links, assignedLinkIds });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payload = await request.json();
  const parsed = smartTagLinkAssignmentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const store = await getDemoStore();
  const tag = store.tags.find((item) => item.id === id && item.active);
  if (!tag) return NextResponse.json({ error: "Active tag not found" }, { status: 404 });

  const validLinkIds = new Set(
    store.links
      .filter((link) => link.businessId === tag.businessId && link.active)
      .map((link) => link.id),
  );
  if (parsed.data.linkIds.some((linkId) => !validLinkIds.has(linkId))) {
    return NextResponse.json({ error: "All assigned links must be active links from this business" }, { status: 400 });
  }

  await setSmartTagLinkAssignments(tag.id, parsed.data.linkIds);
  return NextResponse.json({ linkIds: parsed.data.linkIds });
}