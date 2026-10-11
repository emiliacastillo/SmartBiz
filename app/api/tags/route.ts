import { NextResponse } from "next/server";

import { createTag, getAppStore } from "@/lib/data-store";
import { getSessionUser } from "@/lib/session";
import { tagSchema } from "@/lib/validators";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await getAppStore();
  return NextResponse.json(store.tags);
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = tagSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tag = await createTag({
    ...parsed.data,
    code: parsed.data.code ?? Math.random().toString(36).slice(2, 8).toUpperCase(),
  });

  return NextResponse.json(tag, { status: 201 });
}
