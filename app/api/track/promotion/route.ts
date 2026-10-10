import { NextResponse } from "next/server";

import { getDemoStore, recordInteraction } from "@/lib/demo-store";
import { isSafeExternalUrl } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const promoId = searchParams.get("promoId");
  const tagCode = searchParams.get("tagCode") ?? "";
  const sourceParam = searchParams.get("source");
  const source = sourceParam === "nfc" ? "NFC" : sourceParam === "qr" ? "QR" : "UNKNOWN";

  if (!promoId) {
    return NextResponse.json({ error: "Missing promoId" }, { status: 400 });
  }

  const promotion = getDemoStore().promotions.find((item) => item.id === promoId && item.active);
  if (!promotion || !promotion.destinationUrl) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  const tag = tagCode ? getDemoStore().tags.find((item) => item.code === tagCode.toUpperCase()) : undefined;
  recordInteraction({
    businessId: promotion.businessId,
    smartTagId: tag?.id,
    eventType: "PROMOTION_CLICK",
    source,
  });

  if (!isSafeExternalUrl(promotion.destinationUrl)) {
    return NextResponse.json({ error: "Unsafe destination" }, { status: 400 });
  }

  return NextResponse.redirect(promotion.destinationUrl);
}
