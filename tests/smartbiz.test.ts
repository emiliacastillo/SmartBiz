import { beforeEach, describe, expect, it, vi } from "vitest";

import { aggregateBusinessAnalytics } from "@/lib/analytics";
import { getTagBusinessLinks, recordInteraction, resolveSmartTag, setSmartTagLinkAssignments } from "@/lib/data-store";
import { prisma } from "@/lib/prisma";
import { generateTagCode, isSafeExternalUrl } from "@/lib/utils";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    business: { findUnique: vi.fn() },
    smartTag: { findUnique: vi.fn() },
    businessLink: { findMany: vi.fn() },
    smartTagLink: { deleteMany: vi.fn(), createMany: vi.fn() },
    interaction: { create: vi.fn(), groupBy: vi.fn() },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

const date = new Date("2026-01-01T00:00:00Z");
const tag = { id: "tag-1", businessId: "biz-1", code: "ABC123", name: "Entrance", location: "", active: true, createdAt: date, updatedAt: date };

beforeEach(() => vi.resetAllMocks());

describe("smart business platform", () => {
  it("generates a six-character tag code", () => {
    expect(generateTagCode()).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("validates external URLs", () => {
    expect(isSafeExternalUrl("https://example.com/menu")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
  });

  it("resolves a tag using persisted business data", async () => {
    vi.mocked(prisma.smartTag.findUnique).mockResolvedValue(tag);
    vi.mocked(prisma.business.findUnique).mockResolvedValue({
      id: "biz-1", name: "Test Business", slug: "test", description: null,
      logoUrl: null, primaryColor: "#000000", secondaryColor: "#ffffff",
      phone: null, address: null, website: null, active: true, createdAt: date, updatedAt: date,
    });
    const result = await resolveSmartTag("abc123");
    expect(prisma.smartTag.findUnique).toHaveBeenCalledWith({ where: { code: "ABC123" } });
    expect(result?.business?.name).toBe("Test Business");
    expect(result?.tag.createdAt).toBe(date.toISOString());
  });

  it("rejects missing or inactive tags without fetching a business", async () => {
    vi.mocked(prisma.smartTag.findUnique).mockResolvedValueOnce(null).mockResolvedValueOnce({ ...tag, active: false });
    expect(await resolveSmartTag("MISSING")).toBeNull();
    expect(await resolveSmartTag("ABC123")).toBeNull();
    expect(prisma.business.findUnique).not.toHaveBeenCalled();
  });

  it("propagates database failures", async () => {
    vi.mocked(prisma.smartTag.findUnique).mockRejectedValue(new Error("Database unavailable"));
    await expect(resolveSmartTag("ABC123")).rejects.toThrow("Database unavailable");
  });

  it("persists interactions with an unknown source by default", async () => {
    vi.mocked(prisma.interaction.create).mockResolvedValue({
      id: "event-1", businessId: "biz-1", smartTagId: null, businessLinkId: null,
      eventType: "PAGE_VIEW", source: "UNKNOWN", createdAt: date,
      informationType: null, targetId: null,
    });
    const result = await recordInteraction({ businessId: "biz-1", eventType: "PAGE_VIEW" });
    expect(prisma.interaction.create).toHaveBeenCalledWith({ data: {
      businessId: "biz-1", smartTagId: null, businessLinkId: null, eventType: "PAGE_VIEW", source: "UNKNOWN",
    } });
    expect(result.createdAt).toBe(date.toISOString());
  });

  it("aggregates persisted analytics and fills empty dates", async () => {
    vi.mocked(prisma.interaction.groupBy)
      .mockResolvedValueOnce([{ eventType: "PAGE_VIEW", _count: { _all: 4 } }, { eventType: "LINK_CLICK", _count: { _all: 2 } }] as never)
      .mockResolvedValueOnce([{ source: "QR", _count: { _all: 6 } }] as never)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    const analytics = await aggregateBusinessAnalytics("biz-1", 7);
    expect(analytics.totalPageViews).toBe(4);
    expect(analytics.clickThroughRate).toBe(50);
    expect(analytics.byDate).toHaveLength(7);
    expect(analytics.bySource).toContainEqual({ source: "QR", events: 6 });
  });

  it("restricts links to active services assigned to the tag and business", async () => {
    vi.mocked(prisma.businessLink.findMany).mockResolvedValue([]);
    expect(await getTagBusinessLinks("tag-1", "biz-1")).toEqual([]);
    expect(prisma.businessLink.findMany).toHaveBeenCalledWith({
      where: { businessId: "biz-1", active: true, tagAssignments: { some: { smartTagId: "tag-1" } } },
      orderBy: { position: "asc" },
    });
  });

  it("replaces and clears link assignments within a transaction", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(prisma));
    await setSmartTagLinkAssignments("tag-1", ["link-1"]);
    expect(prisma.smartTagLink.deleteMany).toHaveBeenCalledWith({ where: { smartTagId: "tag-1" } });
    expect(prisma.smartTagLink.createMany).toHaveBeenCalledWith({ data: [{ smartTagId: "tag-1", businessLinkId: "link-1" }] });
    vi.mocked(prisma.smartTagLink.createMany).mockClear();
    await setSmartTagLinkAssignments("tag-1", []);
    expect(prisma.smartTagLink.createMany).not.toHaveBeenCalled();
  });
});
