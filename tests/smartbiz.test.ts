import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { aggregateBusinessAnalytics } from "@/lib/analytics";
import { getBusinessById, getTagByCode, getDemoStore, getTagBusinessLinks, recordInteraction, resolveSmartTag, setSmartTagLinkAssignments } from "@/lib/demo-store";
import { generateTagCode, isSafeExternalUrl } from "@/lib/utils";

const originalDemoMode = process.env.DEMO_MODE;

beforeAll(() => {
  process.env.DEMO_MODE = "true";
});

afterAll(() => {
  if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
  else process.env.DEMO_MODE = originalDemoMode;
});

describe("smart business platform", () => {
  it("generates a six-character tag code", () => {
    const code = generateTagCode();

    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(code.length).toBe(6);
  });

  it("resolves a valid smart tag to its business", async () => {
    const result = await resolveSmartTag("A7K92");

    expect(result).not.toBeNull();
    expect(result?.business?.name).toBe("Columbia Restaurant - Ybor City");
    expect(result?.tag?.code).toBe("A7K92");
  });

  it("validates external URLs correctly", () => {
    expect(isSafeExternalUrl("https://example.com/menu")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
  });

  it("records and aggregates analytics for a business", async () => {
    const business = await getBusinessById("biz-1");
    expect(business).not.toBeNull();

    await recordInteraction({
      businessId: "biz-1",
      eventType: "PAGE_VIEW",
      source: "QR",
    });

    const analytics = await aggregateBusinessAnalytics("biz-1");
    expect(analytics.totalPageViews).toBeGreaterThanOrEqual(1);
    expect(analytics.clickThroughRate).toBeGreaterThanOrEqual(0);
  });

  it("keeps the active tag list stable and aware of the tag source", async () => {
    const business = await getTagByCode("N8L21");
    expect(business).not.toBeNull();
    const store = await getDemoStore();
    expect(store.tags.filter((tag) => tag.active)).toHaveLength(6);
  });

  it("shows only services assigned to a smart tag", async () => {
    const originalLinks = await getTagBusinessLinks("tag-1", "biz-1");
    expect(originalLinks).toHaveLength(3);

    try {
      await setSmartTagLinkAssignments("tag-1", ["link-1"]);
      const assignedLinks = await getTagBusinessLinks("tag-1", "biz-1");
      expect(assignedLinks.map((link) => link.id)).toEqual(["link-1"]);
    } finally {
      await setSmartTagLinkAssignments("tag-1", originalLinks.map((link) => link.id));
    }
  });
});
