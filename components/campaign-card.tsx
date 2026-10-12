"use client";
import { useState } from "react";
import Image from "next/image";
import { Gift, CalendarDays } from "lucide-react";
import type { PromotionRecord } from "@/lib/data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CampaignCard({ promotion, tagCode, source }: { promotion: PromotionRecord; tagCode?: string; source?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const title = promotion.kind === "EVENT" ? "Special event" : promotion.kind === "REWARD" ? "Reward" : "Promotion";
  return <article className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white">
    {promotion.imageUrl ? <Image src={promotion.imageUrl} alt={promotion.title} width={800} height={300} unoptimized className="h-40 w-full object-cover" /> : null}
    <div className="space-y-3 p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-700"><Gift size={16} />{title}</p>
      <h3 className="text-xl font-semibold">{promotion.title}</h3>
      <p className="whitespace-pre-wrap text-sm text-slate-600">{promotion.description}</p>
      {promotion.endsAt ? <p className="flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={14} />Entries close {new Date(promotion.endsAt).toLocaleString("en-US", { timeZone: "America/New_York" })} ET</p> : null}
      {promotion.terms ? <details><summary className="cursor-pointer text-sm font-medium">Participation and redemption terms</summary><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{promotion.terms}</p></details> : null}
      {promotion.destinationUrl ? <a className="inline-block text-sm font-semibold text-orange-700 underline" href={`/api/track/promotion?promoId=${promotion.id}&tagCode=${encodeURIComponent(tagCode ?? "")}&source=${source ?? "unknown"}`} target="_blank" rel="noopener noreferrer">View offer details</a> : null}
      {promotion.entryEnabled && tagCode && !statusUrl ? <Button type="button" className="w-full" onClick={() => {
        let saved: string | null = null;
        try { saved = localStorage.getItem(`reward-entry-${promotion.id}`); } catch { /* Storage may be disabled. */ }
        if (saved && /^\/rewards\/[a-f0-9]{64}$/.test(saved)) setStatusUrl(saved); else setOpen(!open);
      }}>{promotion.awardMode === "INSTANT" ? "Claim reward" : "Apply to participate"}</Button> : null}
      {statusUrl ? <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Your entry is saved. Keep this private link to check results and manage your notification preferences.<a href={statusUrl} referrerPolicy="no-referrer" className="mt-2 block font-semibold underline">View my entry and rewards</a></div> : null}
      {open && !statusUrl ? <form className="space-y-3 border-t border-orange-100 pt-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
        try {
          const response = await fetch(`/api/campaigns/${promotion.id}/enter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
            name: form.get("name"), email: form.get("email"), phone: form.get("phone"), tagCode,
            acceptTerms: form.has("acceptTerms"), emailNoticeConsent: form.has("emailNoticeConsent"), smsNoticeConsent: form.has("smsNoticeConsent"),
            emailMarketingConsent: form.has("emailMarketingConsent"), smsMarketingConsent: form.has("smsMarketingConsent"),
          }) });
          const result = await response.json(); if (!response.ok) throw new Error(result.error);
          setStatusUrl(result.statusUrl); try { localStorage.setItem(`reward-entry-${promotion.id}`, result.statusUrl); } catch { /* Private link remains visible. */ }
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to submit entry"); } finally { setBusy(false); }
      }}>
        <label className="grid gap-1 text-sm">Full name<Input name="name" required maxLength={100} autoComplete="name" /></label>
        <label className="grid gap-1 text-sm">Email<Input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label className="grid gap-1 text-sm">Phone with country code<Input name="phone" type="tel" required pattern="\+[1-9][0-9]{7,14}" placeholder="+13055550101" autoComplete="tel" /></label>
        <p className="text-xs text-slate-500">{promotion.title} is organized by this business. Your name, email and phone are stored to manage participation and redemption. They are not shown publicly. You can change communication preferences from your private entry link.</p>
        <label className="flex items-start gap-2 text-xs"><input name="acceptTerms" type="checkbox" required />I accept the published campaign terms and the use of my details to manage this entry.</label>
        <label className="flex items-start gap-2 text-xs"><input name="emailNoticeConsent" type="checkbox" />Email me the result of this campaign.</label>
        <label className="flex items-start gap-2 text-xs"><input name="smsNoticeConsent" type="checkbox" />Text me the result of this campaign. Message/data rates may apply. Reply STOP to unsubscribe.</label>
        <label className="flex items-start gap-2 text-xs"><input name="emailMarketingConsent" type="checkbox" />Optional: email me future offers and reminders from this business.</label>
        <label className="flex items-start gap-2 text-xs"><input name="smsMarketingConsent" type="checkbox" />Optional: text me future offers and reminders from this business. Message/data rates may apply. Reply STOP to unsubscribe.</label>
        <p className="text-xs text-slate-500">Communication choices are optional and do not affect eligibility. Results are available on your private entry page.</p>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <Button disabled={busy} type="submit" className="w-full">{busy ? "Submitting…" : "Submit entry"}</Button>
      </form> : null}
    </div>
  </article>;
}
