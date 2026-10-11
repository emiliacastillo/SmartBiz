import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessAdministrationControls } from "@/components/admin-crud-controls";
import { BusinessTagManager, CreateBusinessForm } from "@/components/platform-admin-manager";
import { countAllInteractions } from "@/lib/analytics";
import { getAppStore } from "@/lib/data-store";
import { getSessionUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/login");

  const [store, interactionCount] = await Promise.all([getAppStore(), countAllInteractions()]);
  const businesses = store.businesses;
  const tagsByBusinessId = new Map<string, typeof store.tags>();
  for (const tag of store.tags) {
    const businessTags = tagsByBusinessId.get(tag.businessId) ?? [];
    businessTags.push(tag);
    tagsByBusinessId.set(tag.businessId, businessTags);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-600">Platform admin</p>
            <h1 className="text-3xl font-bold">Business overview</h1>
          </div>
          <form action="/api/logout" method="POST"><Button type="submit" variant="outline">Sign out</Button></form>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle>Total businesses</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{businesses.length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Active tags</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{store.tags.filter((tag) => tag.active).length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Interaction events</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{interactionCount}</CardContent></Card>
        </div>

        <div className="mt-8">
          <CreateBusinessForm />
        </div>

        <div className="mt-8 space-y-4">
          {businesses.map((business) => (
            <Card key={business.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{business.name}</CardTitle>
                  <p className="text-sm text-slate-500">/{business.slug}</p>
                </div>
                <div className="flex gap-3">
                  <Link href={`/dashboard?businessId=${business.id}`}><Button variant="secondary">Dashboard</Button></Link>
                  {tagsByBusinessId.get(business.id)?.[0] ? <Link href={`/t/${tagsByBusinessId.get(business.id)?.[0].code}`}><Button variant="outline">Preview</Button></Link> : null}
                </div>
              </CardHeader>
              <CardContent>
                <BusinessAdministrationControls business={business} />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary color</p><p className="mt-2 font-semibold">{business.primaryColor}</p></div>
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phone</p><p className="mt-2 font-semibold">{business.phone}</p></div>
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Website</p><p className="mt-2 font-semibold">{business.website}</p></div>
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p><p className="mt-2 font-semibold">{business.active ? "Active" : "Inactive"}</p></div>
                </div>
                <BusinessTagManager
                  business={business}
                  tags={tagsByBusinessId.get(business.id) ?? []}
                  links={store.links.filter((link) => link.businessId === business.id && link.active)}
                  assignments={store.tagLinkAssignments}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
