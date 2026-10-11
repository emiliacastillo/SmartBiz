import { NextResponse } from "next/server";

import { createBusiness, getDemoStore } from "@/lib/demo-store";
import { businessSchema } from "@/lib/validators";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await getDemoStore();
  return NextResponse.json(store.businesses);
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = businessSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const business = await createBusiness({
    ...parsed.data,
    slug: parsed.data.slug ?? parsed.data.name.toLowerCase().replace(/\s+/g, "-")
  });

  return NextResponse.json(business, { status: 201 });
}
