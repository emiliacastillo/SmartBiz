import { beforeEach, describe, expect, it, vi } from "vitest";
import { linkSchema } from "@/lib/validators";
import { imageContentType } from "@/lib/image-upload";
import { POST } from "@/app/api/track/service/route";
import { getAppStore, recordInteraction, type AppStore } from "@/lib/data-store";

vi.mock("@/lib/data-store", () => ({ getAppStore: vi.fn(), recordInteraction: vi.fn() }));
const base = { businessId: "biz", type: "CUSTOM", label: "Servicio", url: "" };
let store: AppStore;
beforeEach(() => {
  vi.resetAllMocks();
  store = {
    businesses: [{ id: "biz", active: true }] as AppStore["businesses"],
    tags: [{ id: "tag", businessId: "biz", code: "CODE", active: true }] as AppStore["tags"],
    links: [{ ...base, id: "service", active: true, images: [{ id: "image", url: "https://example.com/image.jpg", description: "Corte" }],
      actions: [{ id: "phone", type: "PHONE", label: "Llamar", url: "tel:+18095551234" }],
    }] as AppStore["links"],
    tagLinkAssignments: [{ smartTagId: "tag", businessLinkId: "service" }], promotions: [], interactions: [],
  };
  vi.mocked(getAppStore).mockResolvedValue(store);
});
function request(eventType: string, targetId?: string, tagCode = "CODE") {
  return new Request("https://example.test/api/track/service", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkId: "service", eventType, targetId, tagCode, source: "qr" }),
  });
}

function imageActionRequest(imageId: string, targetId?: string) {
  return new Request("https://example.test/api/track/service", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkId: "service", eventType: "LINK_CLICK", imageId, targetId, tagCode: "CODE", source: "qr" }),
  });
}

describe("rich services", () => {
  it("preserves and validates nested image contacts", () => {
    const image = { ...store.links[0].images[0], actions: store.links[0].actions };
    expect(linkSchema.parse({ ...base, images: [image] }).images?.[0].actions).toEqual(store.links[0].actions);
    expect(linkSchema.safeParse({ ...base, images: [{ ...image, actions: [{ ...image.actions[0], url: "javascript:alert(1)" }] }] }).success).toBe(false);
  });
  it("attributes image action clicks to both image and action, using the stored type", async () => {
    store.links[0].images[0].actions = [{ id: "shop", type: "STORE", label: "Comprar", url: "https://example.com/shop" }];
    expect((await POST(imageActionRequest("image", "shop"))).status).toBe(204);
    expect(recordInteraction).toHaveBeenCalledWith(expect.objectContaining({
      informationType: "IMAGE_STORE", targetId: JSON.stringify(["image", "shop"]), businessLinkId: "service",
    }));
  });
  it("rejects image clicks with missing targets, another image, or a service-level action", async () => {
    store.links[0].images[0].actions = [{ id: "shop", type: "STORE", label: "Comprar", url: "https://example.com/shop" }];
    for (const [imageId, targetId] of [["missing", "shop"], ["image", "phone"], ["image", undefined]]) {
      expect((await POST(imageActionRequest(imageId!, targetId))).status).toBe(404);
    }
    expect(recordInteraction).not.toHaveBeenCalled();
  });
  it("accepts a gallery-only service and preserves optional fields for legacy updates", () => {
    expect(linkSchema.parse(base).url).toBe("");
    expect(linkSchema.parse(base).images).toBeUndefined();
    expect(linkSchema.safeParse({ ...base, images: store.links[0].images, actions: store.links[0].actions }).success).toBe(true);
  });
  it("rejects unsafe URLs and mismatched contact types", () => {
    expect(linkSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(linkSchema.safeParse({ ...base, actions: [{ id: "a", type: "PHONE", label: "Contact", url: "https://example.com" }] }).success).toBe(false);
    expect(linkSchema.safeParse({ ...base, images: [{ id: "i", url: "data:image/svg+xml,x", description: "" }] }).success).toBe(false);
  });
  it("rejects duplicate IDs and oversized galleries", () => {
    const image = store.links[0].images[0];
    expect(linkSchema.safeParse({ ...base, images: [image, image] }).success).toBe(false);
    expect(linkSchema.safeParse({ ...base, images: Array.from({ length: 13 }, (_, i) => ({ ...image, id: String(i) })) }).success).toBe(false);
  });
  it("recognizes allowed image signatures and rejects SVG", () => {
    expect(imageContentType(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]))).toBe("image/png");
    expect(imageContentType(new TextEncoder().encode('<svg onload="alert(1)"/>'))).toBeNull();
  });
  it.each([["SERVICE_VIEW", undefined, "DESCRIPTION"], ["IMAGE_VIEW", "image", "IMAGE"], ["IMAGE_EXPAND", "image", "IMAGE"], ["LINK_CLICK", "phone", "PHONE"]])("records %s with server-derived information type", async (eventType, targetId, informationType) => {
    expect((await POST(request(eventType!, targetId))).status).toBe(204);
    expect(recordInteraction).toHaveBeenCalledWith({ businessId: "biz", businessLinkId: "service", smartTagId: "tag", source: "QR", eventType, informationType, targetId });
  });
  it("rejects unassigned tags and tags belonging to another business", async () => {
    store.tags[0].businessId = "other";
    expect((await POST(request("SERVICE_VIEW"))).status).toBe(404);
    store.tags[0].businessId = "biz";
    store.tagLinkAssignments = [];
    expect((await POST(request("SERVICE_VIEW"))).status).toBe(404);
    expect(recordInteraction).not.toHaveBeenCalled();
  });
  it("rejects inactive services, businesses, and fabricated image/action IDs", async () => {
    expect((await POST(request("IMAGE_EXPAND", "missing"))).status).toBe(404);
    expect((await POST(request("LINK_CLICK", "missing"))).status).toBe(404);
    store.links[0].active = false;
    expect((await POST(request("SERVICE_VIEW"))).status).toBe(404);
    store.links[0].active = true; store.businesses[0].active = false;
    expect((await POST(request("SERVICE_VIEW"))).status).toBe(404);
    expect(recordInteraction).not.toHaveBeenCalled();
  });
});
