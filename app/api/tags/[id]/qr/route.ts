import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { getDemoStore } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";
import { getAppUrl } from "@/lib/utils";

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

  const url = `${getAppUrl()}/t/${tag.code}`;
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const safeCode = tag.code.replace(/[^a-zA-Z0-9_-]/g, "-");

  return new NextResponse(Buffer.from(base64, "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="smart-tag-${safeCode}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
