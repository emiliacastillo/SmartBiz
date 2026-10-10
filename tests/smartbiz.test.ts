import { describe, expect, it } from "vitest";

import { aggregateBusinessAnalytics } from "@/lib/analytics";
import { getBusinessById, getTagByCode, getDemoStore, recordInteraction, resolveSmartTag } from "@/lib/demo-store";
import { generateTagCode, isSafeExternalUrl } from "@/lib/utils";

describe("smart business platform", () => {
  it("generates a six-character tag code", () => {
    const code = generateTagCode();

    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(code.length).toBe(6);
  });

  it("resolves a valid smart tag to its business", () => {
    const result = resolveSmartTag("A7K92");

    expect(result).not.toBeNull();
    expect(result?.business?.name).toBe("Sunset Bistro");
    expect(result?.tag?.code).toBe("A7K92");
  });

  it("validates external URLs correctly", () => {
    expect(isSafeExternalUrl("https://example.com/menu")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
  });

  it("records and aggregates analytics for a business", () => {
    const business = getBusinessById("biz-1");
    expect(business).not.toBeNull();

    recordInteraction({
      businessId: "biz-1",
      eventType: "PAGE_VIEW",
      source: "QR",
    });

    const analytics = aggregateBusinessAnalytics("biz-1");
    expect(analytics.totalPageViews).toBeGreaterThanOrEqual(1);
    expect(analytics.clickThroughRate).toBeGreaterThanOrEqual(0);
  });

  it("keeps the active tag list stable and aware of the tag source", () => {
    const business = getTagByCode("N8L21");
    expect(business).not.toBeNull();
    expect(getDemoStore().tags.filter((tag) => tag.active)).toHaveLength(3);
  });
});
