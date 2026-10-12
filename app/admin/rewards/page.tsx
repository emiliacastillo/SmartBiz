import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RewardsManager } from "@/components/rewards-manager";

export default async function RewardsPage({ searchParams }: { searchParams: Promise<{ businessId?: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/login");
  const businesses = await prisma.business.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const { businessId } = await searchParams;
  const selected = businesses.find((b) => b.id === businessId) ?? businesses[0];
  const services = selected ? await prisma.businessLink.findMany({ where: { businessId: selected.id, active: true }, select: { id: true, label: true }, orderBy: { position: "asc" } }) : [];
  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900"><div className="mx-auto max-w-6xl">
    <Link href="/admin" className="text-sm font-medium text-orange-700">← Business overview</Link>
    <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-orange-600">Customer connections</p>
    <h1 className="mt-2 text-3xl font-bold">Rewards & promotions</h1>
    <p className="mt-2 text-slate-500">Create offers, manage event entries and redeem rewards against your services.</p>
    <form className="my-6 flex items-end gap-3"><label className="grid gap-1 text-sm font-medium">Business<select name="businessId" defaultValue={selected?.id} className="rounded-lg border border-slate-200 bg-white p-3">{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><button className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Open</button></form>
    {selected ? <RewardsManager key={selected.id} businessId={selected.id} services={services} /> : <p>Create a business first.</p>}
  </div></main>;
}
