import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { getDemoStore } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tag = getDemoStore().tags.find((item) => item.id === id);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/t/${tag.code}`;
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");

  return new NextResponse(Buffer.from(base64, "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
