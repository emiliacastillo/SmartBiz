import { NextResponse } from "next/server";
import { z } from "zod";
import { recordInteraction } from "@/lib/data-store";
import { primaryInformationType, isServiceDestination } from "@/lib/service-content";
import { resolveTrackedService } from "@/lib/service-tracking";

const eventSchema = z.object({
  linkId: z.string().min(1).max(100), tagCode: z.string().max(20).optional(),
  eventType: z.enum(["SERVICE_VIEW", "IMAGE_VIEW", "IMAGE_EXPAND", "LINK_CLICK"]),
  targetId: z.string().max(100).optional(), source: z.enum(["nfc", "qr", "unknown"]).default("unknown"),
  imageId: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const event = parsed.data;
  const resolved = await resolveTrackedService(event.linkId, event.tagCode);
  if (!resolved) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  const { link, tag } = resolved;
  let informationType = "DESCRIPTION";
  let targetId = event.targetId;
  if (event.imageId && event.eventType !== "LINK_CLICK") return NextResponse.json({ error: "Invalid image action" }, { status: 400 });
  if (event.eventType === "IMAGE_VIEW" || event.eventType === "IMAGE_EXPAND") {
    if (!link.images.some((image) => image.id === event.targetId)) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    informationType = "IMAGE";
  } else if (event.eventType === "LINK_CLICK") {
    const image = event.imageId ? link.images.find((item) => item.id === event.imageId) : undefined;
    if (event.imageId && (!image || !event.targetId)) return NextResponse.json({ error: "Image action not found" }, { status: 404 });
    const action = (event.imageId ? image?.actions ?? [] : link.actions).find((item) => item.id === event.targetId);
    if (event.targetId ? !action : !isServiceDestination(link.url)) return NextResponse.json({ error: "Action not found" }, { status: 404 });
    informationType = action?.type ?? primaryInformationType(link.type, link.url);
    if (event.imageId) {
      informationType = `IMAGE_${informationType}`;
      targetId = JSON.stringify([event.imageId, event.targetId]);
    }
  } else if (event.targetId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }
  await recordInteraction({
    businessId: link.businessId, businessLinkId: link.id, smartTagId: tag?.id,
    eventType: event.eventType, source: event.source === "nfc" ? "NFC" : event.source === "qr" ? "QR" : "UNKNOWN",
    informationType, targetId,
  });
  return new NextResponse(null, { status: 204 });
}
