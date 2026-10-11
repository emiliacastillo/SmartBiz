"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Power, QrCode, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BusinessRecord, SmartTagRecord } from "@/lib/demo-store";

export function BusinessAdministrationControls({ business }: { business: BusinessRecord }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function updateBusiness(payload: Record<string, unknown>) {
    const response = await fetch(`/api/businesses/${business.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to update this business.");
    router.refresh();
  }

  function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const payload = {
      name: String(values.get("name") ?? "").trim(),
      slug: String(values.get("slug") ?? "").trim(),
      description: String(values.get("description") ?? "").trim(),
      phone: String(values.get("phone") ?? "").trim(),
      address: String(values.get("address") ?? "").trim(),
      website: String(values.get("website") ?? "").trim(),
      logoUrl: String(values.get("logoUrl") ?? "").trim(),
      primaryColor: business.primaryColor,
      secondaryColor: business.secondaryColor,
      active: business.active,
    };

    setError("");
    startTransition(async () => {
      try {
        await updateBusiness(payload);
        setIsEditing(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to update this business.");
      }
    });
  }

  function toggleStatus() {
    setError("");
    startTransition(async () => {
      try {
        await updateBusiness({
          name: business.name,
          slug: business.slug,
          description: business.description,
          phone: business.phone,
          address: business.address,
          website: business.website,
          logoUrl: business.logoUrl ?? "",
          primaryColor: business.primaryColor,
          secondaryColor: business.secondaryColor,
          active: !business.active,
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to update this business.");
      }
    });
  }

  function removeBusiness() {
    if (!window.confirm(`Delete ${business.name}? This permanently deletes all its tags, services, promotions, and analytics.`)) return;
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/businesses/${business.id}`, { method: "DELETE" });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to delete this business.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to delete this business.");
      }
    });
  }

  return (
    <div className="mb-4">
      {error ? <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {!isEditing ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => { setIsEditing(true); setError(""); }} disabled={isPending}>
            <Pencil size={15} aria-hidden="true" /> Edit
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={toggleStatus} disabled={isPending}>
            <Power size={15} aria-hidden="true" /> {business.active ? "Deactivate" : "Activate"}
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={removeBusiness} disabled={isPending}>
            <Trash2 size={15} aria-hidden="true" /> Delete
          </Button>
        </div>
      ) : (
        <form onSubmit={saveBusiness} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">Business name<Input name="name" defaultValue={business.name} minLength={2} maxLength={80} required /></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Slug<Input name="slug" defaultValue={business.slug} minLength={2} maxLength={60} required /></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Description<Input name="description" defaultValue={business.description} maxLength={500} /></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Public phone<Input name="phone" defaultValue={business.phone} maxLength={30} /></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Public address<Input name="address" defaultValue={business.address} maxLength={250} /></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Website<Input name="website" type="url" defaultValue={business.website} /></label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Logo URL<Input name="logoUrl" type="url" defaultValue={business.logoUrl ?? ""} /></label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={isPending}><Save size={15} aria-hidden="true" /> {isPending ? "Saving..." : "Save business"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setIsEditing(false); setError(""); }} disabled={isPending}><X size={15} aria-hidden="true" /> Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function TagAdministrationControls({ tag }: { tag: SmartTagRecord }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function saveTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const payload = {
      name: String(values.get("name") ?? "").trim(),
      code: String(values.get("code") ?? "").trim(),
      location: String(values.get("location") ?? "").trim(),
    };

    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/tags/${tag.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to update this tag.");
        setIsEditing(false);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to update this tag.");
      }
    });
  }

  function toggleStatus() {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/tags/${tag.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !tag.active }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to update this tag.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to update this tag.");
      }
    });
  }

  function removeTag() {
    if (!window.confirm(`Delete tag ${tag.code}? Its service assignments will be removed.`)) return;
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to delete this tag.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to delete this tag.");
      }
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {error ? <p role="alert" className="w-full text-right text-xs text-red-700">{error}</p> : null}
      {isEditing ? (
        <form onSubmit={saveTag} className="grid w-full gap-2 sm:grid-cols-3">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Tag name
            <Input name="name" defaultValue={tag.name} minLength={2} maxLength={80} required />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Tag code
            <Input name="code" defaultValue={tag.code} minLength={4} maxLength={12} required />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Location
            <Input name="location" defaultValue={tag.location} maxLength={120} />
          </label>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" size="sm" disabled={isPending}><Save size={14} aria-hidden="true" /> Save</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setIsEditing(false); setError(""); }} disabled={isPending}><X size={14} aria-hidden="true" /> Cancel</Button>
          </div>
        </form>
      ) : (
        <>
          {tag.active ? (
            <Button asChild type="button" size="sm" variant="outline" disabled={isPending}>
              <a href={`/api/tags/${tag.id}/qr`} download={`smart-tag-${tag.code}.png`} aria-label={`Download QR code for tag ${tag.code}`}>
                <QrCode size={14} aria-hidden="true" /> QR
              </a>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => { setIsEditing(true); setError(""); }} disabled={isPending} aria-label={`Edit tag ${tag.code}`}><Pencil size={14} aria-hidden="true" /> Edit</Button>
          <Button type="button" size="sm" variant="outline" onClick={toggleStatus} disabled={isPending} aria-label={`${tag.active ? "Deactivate" : "Activate"} tag ${tag.code}`}><Power size={14} aria-hidden="true" /> {tag.active ? "Deactivate" : "Activate"}</Button>
          <Button type="button" size="sm" variant="destructive" onClick={removeTag} disabled={isPending} aria-label={`Delete tag ${tag.code}`}><Trash2 size={14} aria-hidden="true" /> Delete</Button>
        </>
      )}
    </div>
  );
}
