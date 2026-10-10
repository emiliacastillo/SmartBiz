import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessById, getBusinessLinks, getBusinessPromotions, getDemoStore } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ businessId?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const businesses = user.role === "admin" ? getDemoStore().businesses : getDemoStore().businesses.filter((business) => business.id === user.businessId);
  const businessId = params.businessId ?? businesses[0]?.id ?? "biz-1";
  const business = getBusinessById(businessId) ?? businesses[0];

  if (!business) redirect("/login");

  const links = getBusinessLinks(business.id);
  const promotions = getBusinessPromotions(business.id);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Business dashboard</p>
            <h1 className="text-3xl font-bold">{business.name}</h1>
          </div>
          <Button variant="outline" onClick={() => {}}>Sign out</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle>Page views</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{getDemoStore().interactions.filter((item) => item.businessId === business.id && item.eventType === "PAGE_VIEW").length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Link clicks</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{getDemoStore().interactions.filter((item) => item.businessId === business.id && item.eventType === "LINK_CLICK").length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Links</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{links.length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Promotions</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{promotions.length}</CardContent></Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Assigned devices</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {getDemoStore().tags.filter((tag) => tag.businessId === business.id).map((tag) => (
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
            <CardContent className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
                  <div>
                    <p className="font-medium">{link.label}</p>
                    <p className="text-sm text-slate-500">{link.type}</p>
                  </div>
                  <span className="text-sm text-slate-600">{link.url}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
