import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoStore } from "@/lib/demo-store";
import { getSessionUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/login");

  const businesses = getDemoStore().businesses;

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-600">Platform admin</p>
            <h1 className="text-3xl font-bold">Business overview</h1>
          </div>
          <Link href="/api/logout"><Button variant="outline">Sign out</Button></Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle>Total businesses</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{businesses.length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Active tags</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{getDemoStore().tags.filter((tag) => tag.active).length}</CardContent></Card>
          <Card><CardHeader><CardTitle>Interaction events</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{getDemoStore().interactions.length}</CardContent></Card>
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
                  <Link href={`/t/${business.slug.includes("bistro") ? "A7K92" : business.slug.includes("nail") ? "N8L21" : "R2Q09"}`}><Button variant="outline">Preview</Button></Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary color</p><p className="mt-2 font-semibold">{business.primaryColor}</p></div>
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phone</p><p className="mt-2 font-semibold">{business.phone}</p></div>
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Website</p><p className="mt-2 font-semibold">{business.website}</p></div>
                  <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p><p className="mt-2 font-semibold">{business.active ? "Active" : "Inactive"}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
