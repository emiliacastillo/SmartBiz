import { NextResponse } from "next/server";

import { getDemoStore, recordInteraction } from "@/lib/demo-store";
import { isSafeExternalUrl } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("linkId");
  const tagCode = searchParams.get("tagCode") ?? "";
  const sourceParam = searchParams.get("source");
  const source = sourceParam === "nfc" ? "NFC" : sourceParam === "qr" ? "QR" : "UNKNOWN";

  if (!linkId) {
    return NextResponse.json({ error: "Missing linkId" }, { status: 400 });
  }

  const link = getDemoStore().links.find((item) => item.id === linkId && item.active);
  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const tag = tagCode ? getDemoStore().tags.find((item) => item.code === tagCode.toUpperCase()) : undefined;

  recordInteraction({
    businessId: link.businessId,
    smartTagId: tag?.id,
    businessLinkId: link.id,
    eventType: "LINK_CLICK",
    source,
  });

  if (!isSafeExternalUrl(link.url)) {
    return NextResponse.json({ error: "Unsafe destination" }, { status: 400 });
  }

  return NextResponse.redirect(link.url);
}
