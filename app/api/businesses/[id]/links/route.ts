import { NextResponse } from "next/server";

import { createLink, getBusinessLinks } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";
import { linkSchema } from "@/lib/validators";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const links = getBusinessLinks(id);
  return NextResponse.json(links);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payload = await request.json();
  const parsed = linkSchema.safeParse({ ...payload, businessId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const link = createLink(parsed.data);
  return NextResponse.json(link, { status: 201 });
}
