import { getDemoStore } from "@/lib/demo-store";

export function aggregateBusinessAnalytics(businessId: string) {
  const interactions = getDemoStore().interactions.filter((item) => item.businessId === businessId);

  const totalPageViews = interactions.filter((item) => item.eventType === "PAGE_VIEW").length;
  const totalLinkClicks = interactions.filter((item) => item.eventType === "LINK_CLICK").length;
  const totalPromotions = interactions.filter((item) => item.eventType === "PROMOTION_CLICK").length;

  const byDate = new Map<string, { pageViews: number; linkClicks: number; promotionClicks: number }>();

  for (const item of interactions) {
    const dateKey = item.createdAt.slice(0, 10);
    const current = byDate.get(dateKey) ?? { pageViews: 0, linkClicks: 0, promotionClicks: 0 };
    if (item.eventType === "PAGE_VIEW") current.pageViews += 1;
    if (item.eventType === "LINK_CLICK") current.linkClicks += 1;
    if (item.eventType === "PROMOTION_CLICK") current.promotionClicks += 1;
    byDate.set(dateKey, current);
  }

  const mostClickedLinks = Array.from(
    new Map(
      interactions
        .filter((item) => item.businessLinkId)
        .reduce<Map<string, number>>((acc, item) => {
          const key = item.businessLinkId ?? "unknown";
          acc.set(key, (acc.get(key) ?? 0) + 1);
          return acc;
        }, new Map()),
    ).entries(),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([linkId, count]) => ({
      linkId,
      count,
    }));

  return {
    totalPageViews,
    totalLinkClicks,
    totalPromotions,
    clickThroughRate: totalPageViews === 0 ? 0 : (totalLinkClicks / totalPageViews) * 100,
    byDate: Object.fromEntries(Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b))),
    mostClickedLinks,
  };
}
