import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await prisma.uploadedImage.findFirst({ where: { id, business: { active: true } } });
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(image.content), { headers: {
    "Content-Type": image.contentType, "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=3600", "Content-Disposition": "inline",
  } });
}
