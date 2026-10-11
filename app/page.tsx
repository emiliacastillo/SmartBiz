import Link from "next/link";
import { connection } from "next/server";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppStore } from "@/lib/data-store";
import { getAppUrl } from "@/lib/utils";

export default async function HomePage() {
  await connection();
  const store = await getAppStore();
  const businesses = store.businesses;
  const activeTags = store.tags.filter((tag) => tag.active);
  const tagsByBusinessId = new Map<string, typeof activeTags>();
  for (const tag of activeTags) {
    const businessTags = tagsByBusinessId.get(tag.businessId) ?? [];
    businessTags.push(tag);
    tagsByBusinessId.set(tag.businessId, businessTags);
  }
  const firstTagCode = activeTags[0]?.code;
  const tagEntries = businesses.flatMap((business) =>
    (tagsByBusinessId.get(business.id) ?? []).map((tag) => ({ business, tag })),
  );
  const visibleTagEntries = tagEntries.slice(0, 3);
  const additionalTagEntries = tagEntries.slice(3);
  const appUrl = getAppUrl();
  const publicMenuCount = store.links.filter((link) => link.active && link.type === "MENU").length;
  const publicContactCount = businesses.filter((business) => business.phone || business.website).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">SmartBiz</p>
          <h1 className="text-2xl font-bold">NFC / QR Smart Business Platform</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="outline">Admin login</Button></Link>
          <Link href="/admin"><Button>Open dashboard</Button></Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-12 pt-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Built for local businesses</span>
          <h2 className="max-w-lg text-4xl font-bold tracking-tight md:text-6xl">Turn every tap and scan into a branded digital experience.</h2>
          <p className="max-w-xl text-lg text-slate-600">
            Connect a permanent tag URL to menus, bookings, reviews, promotions, Instagram, and contact actions without reprogramming physical devices.
          </p>
          <div className="flex flex-wrap gap-3">
            {firstTagCode ? <Link href={`/t/${firstTagCode}`}><Button size="lg">Preview smart page</Button></Link> : null}
            <Link href="/login"><Button variant="secondary" size="lg">Create business</Button></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-bold">{businesses.length}</p><p className="text-sm text-slate-600">Florida businesses</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-bold">{publicMenuCount}</p><p className="text-sm text-slate-600">public menus</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-bold">{publicContactCount}</p><p className="text-sm text-slate-600">public contacts</p></div>
          </div>
        </div>

        <section className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm uppercase tracking-[0.2em] text-orange-300">Smart tag links</span>
              <span className="mt-1 block text-xs text-slate-400">Public URLs for local and deployed app</span>
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {visibleTagEntries.map(({ business, tag }) => {
              const smartTagUrl = `${appUrl}/t/${tag.code}`;
              return (
                <div key={tag.id} className="rounded-xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{business.name}</p>
                      <p className="truncate text-sm text-slate-300">{tag.name || tag.location || tag.code}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-200">Active</span>
                  </div>
                  <a href={smartTagUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden text-ellipsis rounded-lg border border-white/10 bg-slate-950/40 p-3 font-mono text-sm text-orange-200 hover:text-orange-100">
                    {smartTagUrl}
                  </a>
                </div>
              );
            })}
          </div>
          {additionalTagEntries.length ? (
            <details className="group mt-4 border-t border-white/10 pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-medium text-slate-200 [&::-webkit-details-marker]:hidden">
                <span>Show {additionalTagEntries.length} more {additionalTagEntries.length === 1 ? "tag" : "tags"}</span>
                <ChevronDown className="shrink-0 text-orange-300 transition-transform group-open:rotate-180" size={18} aria-hidden="true" />
              </summary>
              <div className="mt-3 space-y-4">
                {additionalTagEntries.map(({ business, tag }) => {
                  const smartTagUrl = `${appUrl}/t/${tag.code}`;
                  return (
                    <div key={tag.id} className="rounded-xl bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold">{business.name}</p>
                          <p className="truncate text-sm text-slate-300">{tag.name || tag.location || tag.code}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-200">Active</span>
                      </div>
                      <a href={smartTagUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden text-ellipsis rounded-lg border border-white/10 bg-slate-950/40 p-3 font-mono text-sm text-orange-200 hover:text-orange-100">
                        {smartTagUrl}
                      </a>
                    </div>
                  );
                })}
              </div>
            </details>
          ) : null}
        </section>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Florida businesses</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{business.name}</CardTitle>
                <CardDescription>{business.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-600">{business.phone}</div>
                {tagsByBusinessId.get(business.id)?.[0] ? (
                  <Link href={`/t/${tagsByBusinessId.get(business.id)?.[0].code}`}>
                    <Button className="w-full">Open smart page</Button>
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
