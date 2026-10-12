import { NextResponse } from "next/server";

import { recordInteraction } from "@/lib/data-store";
import { prisma } from "@/lib/prisma";
import { campaignAvailable } from "@/lib/reward-validation";
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

  const promotion = await prisma.promotion.findUnique({ where: { id: promoId }, include: { business: true } });
  if (!promotion || !promotion.business.active || !campaignAvailable(promotion) || !promotion.destinationUrl) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  const tag = tagCode ? await prisma.smartTag.findFirst({ where: { code: tagCode.toUpperCase(), active: true, businessId: promotion.businessId } }) : null;
  if (tagCode && !tag) return NextResponse.json({ error: "Invalid business tag" }, { status: 400 });
  await recordInteraction({
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
