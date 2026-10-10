import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoStore } from "@/lib/demo-store";

export default function HomePage() {
  const businesses = getDemoStore().businesses;

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
            <Link href="/t/A7K92"><Button size="lg">Preview smart page</Button></Link>
            <Link href="/login"><Button variant="secondary" size="lg">Create business</Button></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-bold">18k+</p><p className="text-sm text-slate-600">page views</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-bold">92%</p><p className="text-sm text-slate-600">tap-through</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-2xl font-bold">3x</p><p className="text-sm text-slate-600">rebooking lift</p></div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-300">Demo tags</p>
          <div className="mt-6 space-y-4">
            {businesses.map((business) => (
              <div key={business.id} className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{business.name}</p>
                    <p className="text-sm text-slate-300">{business.slug}</p>
                  </div>
                  <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-200">Active</span>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 font-mono text-sm text-orange-200">
                  https://localhost:3000/t/{business.slug.includes("bistro") ? "A7K92" : business.slug.includes("nail") ? "N8L21" : "R2Q09"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Example businesses</p>
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
                <Link href={`/t/${business.slug.includes("bistro") ? "A7K92" : business.slug.includes("nail") ? "N8L21" : "R2Q09"}`}>
                  <Button className="w-full">Open smart page</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
