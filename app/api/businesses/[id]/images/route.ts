import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { imageContentType, MAX_IMAGE_BYTES } from "@/lib/image-upload";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!await prisma.business.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  // Bound the request stream before parsing multipart input, including chunked requests.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Missing image" }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > MAX_IMAGE_BYTES + 65536) {
      await reader.cancel();
      return NextResponse.json({ error: "La imagen no puede superar 2 MB" }, { status: 413 });
    }
    chunks.push(part.value);
  }
  const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Missing image" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "La imagen no puede superar 2 MB" }, { status: 413 });
  const content = new Uint8Array(await file.arrayBuffer());
  const contentType = imageContentType(content);
  if (!contentType) return NextResponse.json({ error: "Usa JPEG, PNG o WebP" }, { status: 400 });
  const image = await prisma.uploadedImage.create({ data: { businessId: id, content, contentType }, select: { id: true } });
  return NextResponse.json({ id: image.id, url: `/api/media/${image.id}` }, { status: 201 });
}
