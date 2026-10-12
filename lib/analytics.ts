import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const allowedDayRanges = [7, 30, 90] as const;
type DayRange = (typeof allowedDayRanges)[number];
type EventName = "PAGE_VIEW" | "LINK_CLICK" | "PROMOTION_CLICK";
type SourceName = "NFC" | "QR" | "UNKNOWN";
type DailyMetrics = { date: string; pageViews: number; linkClicks: number; promotionClicks: number };

export type BusinessAnalytics = {
  serviceAccess?: { serviceId: string; label: string; informationType: string; eventType: string; count: number }[];
  totalPageViews: number;
  totalLinkClicks: number;
  totalPromotions: number;
  clickThroughRate: number;
  byDate: DailyMetrics[];
  bySource: { source: SourceName; events: number }[];
  mostClickedLinks: { linkId: string; label: string; url: string; count: number }[];
};

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

export async function aggregateBusinessAnalytics(businessId: string, requestedDays = 30): Promise<BusinessAnalytics> {
  const days = normalizeDayRange(requestedDays);
  const { startAt, endAt } = makeDateWindow(days);

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

  const serviceGroups = await prisma.interaction.groupBy({
    by: ["businessLinkId", "informationType", "eventType"],
    where: { ...where, businessLinkId: { not: null }, informationType: { not: null } },
    _count: { _all: true },
  });
  const serviceIds = [...new Set(serviceGroups.map((group) => group.businessLinkId!))];
  const services = serviceIds.length ? await prisma.businessLink.findMany({
    where: { businessId, id: { in: serviceIds } }, select: { id: true, label: true },
  }) : [];
  return {
    ...buildAnalyticsResult(counts, sourceCounts, dailySeries, linkCounts, links),
    serviceAccess: serviceGroups.map((group) => ({
      serviceId: group.businessLinkId!, label: services.find((service) => service.id === group.businessLinkId)?.label ?? "Deleted service",
      informationType: group.informationType!, eventType: group.eventType, count: group._count._all,
    })),
  };
}

export async function countAllInteractions() {
  return prisma.interaction.count();
}

function buildAnalyticsResult(
  counts: Partial<Record<EventName, number>>,
  sourceCounts: Partial<Record<SourceName, number>>,
  byDate: DailyMetrics[],
  linkCounts: Map<string, number>,
  links: Array<{ id: string; label: string; url: string }>,
): BusinessAnalytics {
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
