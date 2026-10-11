import { Prisma } from "@prisma/client";

import { isDemoModeEnabled } from "@/lib/env";
import { getDemoStore } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";

const allowedDayRanges = [7, 30, 90] as const;
type DayRange = (typeof allowedDayRanges)[number];
type EventName = "PAGE_VIEW" | "LINK_CLICK" | "PROMOTION_CLICK";
type SourceName = "NFC" | "QR" | "UNKNOWN";
type DailyMetrics = { date: string; pageViews: number; linkClicks: number; promotionClicks: number };

function normalizeDayRange(value: number): DayRange {
  return allowedDayRanges.includes(value as DayRange) ? value as DayRange : 30;
}

function makeDateWindow(days: DayRange) {
  const today = new Date();
  const endAt = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  const startAt = new Date(endAt);
  startAt.setUTCDate(startAt.getUTCDate() - days);
  return { startAt, endAt };
}

function makeDailySeries(startAt: Date, days: DayRange) {
  return Array.from({ length: days }, (_, index): DailyMetrics => {
    const day = new Date(startAt);
    day.setUTCDate(day.getUTCDate() + index);
    return {
      date: day.toISOString().slice(0, 10),
      pageViews: 0,
      linkClicks: 0,
      promotionClicks: 0,
    };
  });
}

function makeSourceMetrics(counts: Partial<Record<SourceName, number>>) {
  return (["NFC", "QR", "UNKNOWN"] as const).map((source) => ({
    source,
    events: counts[source] ?? 0,
  }));
}

export async function aggregateBusinessAnalytics(businessId: string, requestedDays = 30) {
  const days = normalizeDayRange(requestedDays);
  const { startAt, endAt } = makeDateWindow(days);

  if (isDemoModeEnabled()) {
    const store = await getDemoStore();
    const interactions = store.interactions.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return item.businessId === businessId && createdAt >= startAt && createdAt < endAt;
    });
    const byDate = new Map(makeDailySeries(startAt, days).map((day) => [day.date, day]));

    for (const interaction of interactions) {
      const dateKey = interaction.createdAt.slice(0, 10);
      const daily = byDate.get(dateKey);
      if (!daily) continue;
      if (interaction.eventType === "PAGE_VIEW") daily.pageViews += 1;
      if (interaction.eventType === "LINK_CLICK") daily.linkClicks += 1;
      if (interaction.eventType === "PROMOTION_CLICK") daily.promotionClicks += 1;
    }

    return buildAnalyticsResult(
      interactions.reduce<Partial<Record<EventName, number>>>((counts, item) => {
        counts[item.eventType] = (counts[item.eventType] ?? 0) + 1;
        return counts;
      }, {}),
      interactions.reduce<Partial<Record<SourceName, number>>>((counts, item) => {
        counts[item.source] = (counts[item.source] ?? 0) + 1;
        return counts;
      }, {}),
      Array.from(byDate.values()),
      interactions.reduce<Map<string, number>>((counts, item) => {
        if (item.eventType === "LINK_CLICK" && item.businessLinkId) {
          counts.set(item.businessLinkId, (counts.get(item.businessLinkId) ?? 0) + 1);
        }
        return counts;
      }, new Map()),
      store.links.map(({ id, label, url }) => ({ id, label, url })),
    );
  }

  const where = { businessId, createdAt: { gte: startAt, lt: endAt } };
  const [eventGroups, sourceGroups, dailyRows, linkGroups] = await Promise.all([
    prisma.interaction.groupBy({ by: ["eventType"], where, _count: { _all: true } }),
    prisma.interaction.groupBy({ by: ["source"], where, _count: { _all: true } }),
    prisma.$queryRaw<DailyMetrics[]>(Prisma.sql`
      SELECT
        to_char("createdAt"::date, 'YYYY-MM-DD') AS "date",
        COUNT(*) FILTER (WHERE "eventType" = 'PAGE_VIEW')::int AS "pageViews",
        COUNT(*) FILTER (WHERE "eventType" = 'LINK_CLICK')::int AS "linkClicks",
        COUNT(*) FILTER (WHERE "eventType" = 'PROMOTION_CLICK')::int AS "promotionClicks"
      FROM "Interaction"
      WHERE "businessId" = ${businessId}
        AND "createdAt" >= ${startAt}
        AND "createdAt" < ${endAt}
      GROUP BY "createdAt"::date
      ORDER BY "createdAt"::date
    `),
    prisma.interaction.groupBy({
      by: ["businessLinkId"],
      where: { ...where, businessLinkId: { not: null }, eventType: "LINK_CLICK" },
      _count: { _all: true },
    }),
  ]);

  const counts = Object.fromEntries(eventGroups.map((group) => [group.eventType, group._count._all])) as Partial<Record<EventName, number>>;
  const sourceCounts = Object.fromEntries(sourceGroups.map((group) => [group.source, group._count._all])) as Partial<Record<SourceName, number>>;
  const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]));
  const dailySeries = makeDailySeries(startAt, days).map((day) => dailyByDate.get(day.date) ?? day);
  const linkCounts = new Map(
    linkGroups
      .filter((group): group is typeof group & { businessLinkId: string } => group.businessLinkId !== null)
      .map((group) => [group.businessLinkId, group._count._all]),
  );
  const topLinkIds = Array.from(linkCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const links = topLinkIds.length
    ? await prisma.businessLink.findMany({ where: { id: { in: topLinkIds.map(([id]) => id) } }, select: { id: true, label: true, url: true } })
    : [];

  return buildAnalyticsResult(counts, sourceCounts, dailySeries, linkCounts, links);
}

export async function countAllInteractions() {
  if (isDemoModeEnabled()) return (await getDemoStore()).interactions.length;
  return prisma.interaction.count();
}

function buildAnalyticsResult(
  counts: Partial<Record<EventName, number>>,
  sourceCounts: Partial<Record<SourceName, number>>,
  byDate: DailyMetrics[],
  linkCounts: Map<string, number>,
  links: Array<{ id: string; label: string; url: string }>,
) {
  const totalPageViews = counts.PAGE_VIEW ?? 0;
  const totalLinkClicks = counts.LINK_CLICK ?? 0;

  return {
    totalPageViews,
    totalLinkClicks,
    totalPromotions: counts.PROMOTION_CLICK ?? 0,
    clickThroughRate: totalPageViews === 0 ? 0 : (totalLinkClicks / totalPageViews) * 100,
    byDate,
    bySource: makeSourceMetrics(sourceCounts),
    mostClickedLinks: Array.from(linkCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .flatMap(([linkId, count]) => {
        const link = links.find((item) => item.id === linkId);
        return link ? [{ linkId, label: link.label, url: link.url, count }] : [];
      }),
  };
}
