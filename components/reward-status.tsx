"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type Status = { title: string; business: string; status: string; terms: string; code: string | null; available: boolean; redemptionEndsAt: string | null; services: { id: string; label: string }[]; emailMarketingConsent: boolean; smsMarketingConsent: boolean; emailNoticeConsent: boolean; smsNoticeConsent: boolean };
export function RewardStatus({ token }: { token: string }) {
  const [data, setData] = useState<Status | null>(null); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const refresh = useCallback(async () => { try { const res = await fetch(`/api/rewards/${token}`, { cache: "no-store" }); const result = await res.json(); if (!res.ok) throw new Error(result.error); setData(result); setError(""); } catch { setError("Unable to load this entry. Check your private link or try again."); } }, [token]);
  useEffect(() => {
    let canceled = false;
    fetch(`/api/rewards/${token}`, { cache: "no-store" }).then(async (res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((result) => { if (!canceled) setData(result); }).catch(() => { if (!canceled) setError("Unable to load this entry. Check your private link or try again."); });
    const timer = setInterval(() => void refresh(), 30000);
    return () => { canceled = true; clearInterval(timer); };
  }, [refresh, token]);
  return <main className="mx-auto max-w-xl space-y-5 px-5 py-12">
    <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">My reward</p>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    {!data && !error ? <p>Loading your entry…</p> : null}
    {data ? <>
      <h1 className="text-3xl font-bold">{data.title}</h1><p>{data.business}</p>
      <div role="status" className="rounded-2xl bg-orange-50 p-5"><h2 className="text-xl font-semibold">{data.status === "AWARDED" ? "Congratulations! You received a reward." : data.status === "REDEEMED" ? "Your reward has been redeemed." : "Your entry is awaiting a result."}</h2>
        {!data.available ? <p className="mt-2">This campaign is paused, removed or past its redemption deadline. Contact the business for help.</p> : null}
        {data.code ? <><p className="mt-3 text-sm">Show this one-time code to the business. Keep it private.</p><code className="mt-2 block break-all rounded bg-white p-3 font-bold">{data.code}</code></> : null}
      </div>
      <h2 className="font-semibold">Eligible services</h2><ul className="list-inside list-disc">{data.services.map((s) => <li key={s.id}>{s.label}</li>)}</ul>
      {!data.services.length ? <p>Contact the business to arrange this offer.</p> : null}
      {data.redemptionEndsAt ? <p className="text-sm">Redeem by {new Date(data.redemptionEndsAt).toLocaleString("en-US", { timeZone: "America/New_York" })} ET.</p> : null}
      <p className="whitespace-pre-wrap text-sm text-slate-600">{data.terms}</p>
      <Button variant="outline" onClick={() => void refresh()}>Check for updates</Button>
      <form className="space-y-3 border-t pt-5" key={`${data.emailMarketingConsent}-${data.smsMarketingConsent}-${data.emailNoticeConsent}-${data.smsNoticeConsent}`} onSubmit={async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget); setMessage("");
        try { const res = await fetch(`/api/rewards/${token}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(["emailMarketingConsent", "smsMarketingConsent", "emailNoticeConsent", "smsNoticeConsent"].map((key) => [key, form.has(key)]))) }); if (!res.ok) throw new Error(); await refresh(); setMessage("Preferences saved."); } catch { setMessage("Unable to save preferences. Please try again."); }
      }}><h2 className="font-semibold">Notification preferences</h2>
        {([ ["emailNoticeConsent", "Email results for this entry"], ["smsNoticeConsent", "SMS results for this entry"], ["emailMarketingConsent", "Future offers and reminders by email"], ["smsMarketingConsent", "Future offers and reminders by SMS"] ] as const).map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" name={key} defaultChecked={data[key]} />{label}</label>)}
        <p className="text-xs text-slate-500">Uncheck a channel to stop future messages. SMS rates may apply; reply STOP to unsubscribe.</p><Button type="submit">Save preferences</Button><p role="status">{message}</p>
      </form>
    </> : null}
  </main>;
}
