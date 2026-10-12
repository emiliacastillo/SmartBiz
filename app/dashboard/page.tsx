import { informationLabel } from "@/lib/service-content";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessLinkManager } from "@/components/business-link-manager";
import { getAppStore, getBusinessLinks, getBusinessPromotions } from "@/lib/data-store";
import { aggregateBusinessAnalytics } from "@/lib/analytics";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ businessId?: string; days?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const store = await getAppStore();
  const businesses = user.role === "admin" ? store.businesses : store.businesses.filter((business) => business.id === user.businessId);
  const businessId = user.role === "admin" ? params.businessId ?? businesses[0]?.id : user.businessId;
  const business = businesses.find((item) => item.id === businessId);
  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30;

  if (!business) redirect("/login");

  const [links, promotions, analytics] = await Promise.all([
    getBusinessLinks(business.id),
    getBusinessPromotions(business.id),
    aggregateBusinessAnalytics(business.id, days),
  ]);
  const dailyRows = analytics.byDate.slice(-14);
  const maxDailyViews = Math.max(1, ...dailyRows.map((day) => day.pageViews));
  const maxDailyClicks = Math.max(1, ...dailyRows.map((day) => day.linkClicks));

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Business dashboard</p>
            <h1 className="text-3xl font-bold">{business.name}</h1>
            {user.role === "admin" ? <Link href={`/admin/rewards?businessId=${business.id}`} className="mt-2 inline-block text-sm font-semibold text-orange-700">Manage rewards & promotions →</Link> : null}
          </div>
          <form action="/api/logout" method="POST">
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        </div>

        <section className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Performance</p>
            <h2 className="mt-1 text-xl font-semibold">Analytics</h2>
          </div>
          <form action="/dashboard" method="GET" className="flex items-end gap-2">
            {user.role === "admin" ? <input type="hidden" name="businessId" value={business.id} /> : null}
            <label className="grid gap-1 text-sm font-medium text-slate-600">
              Date range
              <select name="days" defaultValue={String(days)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </label>
            <Button type="submit" variant="outline">Apply</Button>
          </form>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader><CardTitle>Page views</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{analytics.totalPageViews}</CardContent></Card>
          <Card><CardHeader><CardTitle>Link clicks</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{analytics.totalLinkClicks}</CardContent></Card>
          <Card><CardHeader><CardTitle>Promotion clicks</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{analytics.totalPromotions}</CardContent></Card>
          <Card><CardHeader><CardTitle>Click-through rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{analytics.clickThroughRate.toFixed(1)}%</CardContent></Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader><CardTitle>Daily views and clicks</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-orange-500" />Views</span>
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />Clicks</span>
              </div>
              <div className="overflow-x-auto">
                <div className="grid min-w-[560px] grid-cols-[repeat(14,minmax(0,1fr))] gap-2">
                  {dailyRows.map((day) => (
                    <div key={day.date} className="flex h-40 flex-col items-center justify-end gap-2">
                      <div className="flex h-32 w-full items-end justify-center gap-1 border-b border-slate-200">
                        <div title={`${day.pageViews} views`} className="w-2 rounded-t-sm bg-orange-500" style={{ height: `${day.pageViews ? Math.max(4, (day.pageViews / maxDailyViews) * 100) : 1}%` }} />
                        <div title={`${day.linkClicks} clicks`} className="w-2 rounded-t-sm bg-emerald-600" style={{ height: `${day.linkClicks ? Math.max(4, (day.linkClicks / maxDailyClicks) * 100) : 1}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{day.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Traffic sources</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {analytics.bySource.map(({ source, events }) => (
                <div key={source} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <span className="font-medium">{source === "UNKNOWN" ? "Direct / unknown" : source}</span>
                  <span className="tabular-nums text-slate-600">{events} events</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Top links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {analytics.mostClickedLinks.length ? analytics.mostClickedLinks.map((link) => (
                <div key={link.linkId} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{link.label}</p>
                    <p className="truncate text-sm text-slate-500">{link.url}</p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{link.count}</span>
                </div>
              )) : <p className="text-sm text-slate-500">No link clicks in this period.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Active links</p><p className="mt-1 text-2xl font-semibold">{links.length}</p></div>
              <div><p className="text-sm text-slate-500">Active promotions</p><p className="mt-1 text-2xl font-semibold">{promotions.length}</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Content accessed by service</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-500">Interactions during the selected period; these are not unique customers.</p>
              {analytics.serviceAccess?.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                <thead><tr><th className="p-2">Service</th><th className="p-2">Information</th><th className="p-2">Action</th><th className="p-2">Interactions</th></tr></thead>
                <tbody>{analytics.serviceAccess.map((row) => <tr key={`${row.serviceId}-${row.informationType}-${row.eventType}`} className="border-t">
                  <td className="p-2">{row.label}</td><td className="p-2">{informationLabel(row.informationType)}</td>
                  <td className="p-2">{({ SERVICE_VIEW: "Open description", IMAGE_VIEW: "View image", IMAGE_EXPAND: "Expand image", LINK_CLICK: "Open link/contact" } as Record<string, string>)[row.eventType] ?? row.eventType}</td><td className="p-2">{row.count}</td>
                </tr>)}</tbody>
              </table></div> : <p className="text-sm text-slate-500">No service interactions in this period yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Assigned devices</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {store.tags.filter((tag) => tag.businessId === business.id).map((tag) => (
                <div key={tag.id} className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
                  <div>
                    <p className="font-medium">{tag.name}</p>
                    <p className="text-sm text-slate-500">{tag.code}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{tag.active ? "active" : "inactive"}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Smart page links</CardTitle></CardHeader>
            <CardContent>
              <BusinessLinkManager businessId={business.id} initialLinks={links} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
