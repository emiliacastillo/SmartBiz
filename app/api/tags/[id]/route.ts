import { NextResponse } from "next/server";

import { deleteTag, getDemoStore, updateTag } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";
import { tagSchema } from "@/lib/validators";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const store = await getDemoStore();
  const tag = store.tags.find((item) => item.id === id);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  return NextResponse.json(tag);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payload = await request.json();
  const store = await getDemoStore();
  const existingTag = store.tags.find((item) => item.id === id);
  if (!existingTag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const parsed = tagSchema.safeParse({ ...payload, businessId: existingTag.businessId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tag = await updateTag(id, parsed.data);
  return NextResponse.json(tag);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const store = await getDemoStore();
  if (!store.tags.some((tag) => tag.id === id)) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await deleteTag(id);
  return NextResponse.json({ success: true });
}
