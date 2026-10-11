import { NextResponse } from "next/server";

import { recordInteraction } from "@/lib/data-store";
import { resolveTrackedService } from "@/lib/service-tracking";
import { primaryInformationType } from "@/lib/service-content";
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

  const resolved = await resolveTrackedService(linkId, tagCode);
  if (!resolved) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const { link, tag } = resolved;
  if (!isSafeExternalUrl(link.url)) {
    return NextResponse.json({ error: "Unsafe destination" }, { status: 400 });
  }

  await recordInteraction({
    businessId: link.businessId,
    smartTagId: tag?.id,
    businessLinkId: link.id,
    eventType: "LINK_CLICK",
    source,
    informationType: primaryInformationType(link.type, link.url),
  });

  return NextResponse.redirect(link.url);
}
