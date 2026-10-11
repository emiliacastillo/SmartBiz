"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BusinessLinkRecord } from "@/lib/data-store";

const linkTypes = [
  ["MENU", "Menu"],
  ["BOOKING", "Booking"],
  ["RESERVATION", "Reservation"],
  ["PHONE", "Phone"],
  ["WHATSAPP", "WhatsApp"],
  ["REVIEWS", "Reviews"],
  ["WEBSITE", "Website"],
  ["INSTAGRAM", "Instagram"],
  ["FACEBOOK", "Facebook"],
  ["CUSTOM", "Service / other link"],
] as const;

type LinkType = (typeof linkTypes)[number][0];
type FormState = { type: LinkType; label: string; url: string; icon: string };

const emptyForm: FormState = { type: "CUSTOM", label: "", url: "", icon: "link" };

export function BusinessLinkManager({
  businessId,
  initialLinks,
}: {
  businessId: string;
  initialLinks: BusinessLinkRecord[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [editingLink, setEditingLink] = useState<BusinessLinkRecord | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openCreateForm() {
    setEditingLink(null);
    setIsAdding(true);
    setError("");
  }

  function openEditForm(link: BusinessLinkRecord) {
    setEditingLink(link);
    setIsAdding(false);
    setError("");
  }

  function closeForm() {
    setEditingLink(null);
    setIsAdding(false);
    setError("");
  }

  async function saveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const type = String(formData.get("type")) as LinkType;
    const payload = {
      businessId,
      type,
      label: String(formData.get("label") ?? "").trim(),
      url: String(formData.get("url") ?? "").trim(),
      icon: String(formData.get("icon") ?? "link").trim() || "link",
      position: editingLink?.position ?? (Math.max(0, ...links.map((link) => link.position)) + 1),
      active: true,
    };

    startTransition(async () => {
      try {
        const response = await fetch(
          editingLink ? `/api/links/${editingLink.id}` : `/api/businesses/${businessId}/links`,
          {
            method: editingLink ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to save this link.");

        setLinks((current) => editingLink
          ? current.map((link) => link.id === result.id ? result as BusinessLinkRecord : link)
          : [...current, result as BusinessLinkRecord].sort((a, b) => a.position - b.position));
        closeForm();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save this link.");
      }
    });
  }

  function removeLink(link: BusinessLinkRecord) {
    if (!window.confirm(`Remove "${link.label}" from this smart page?`)) return;
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to remove this link.");
        setLinks((current) => current.filter((item) => item.id !== link.id));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to remove this link.");
      }
    });
  }

  const formValues = editingLink ?? emptyForm;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Manage the services and public links shown on this business page.</p>
        {!isAdding && !editingLink ? (
          <Button type="button" size="sm" onClick={openCreateForm}>
            <Plus size={16} aria-hidden="true" /> Add service or link
          </Button>
        ) : null}
      </div>

      {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {isAdding || editingLink ? (
        <form onSubmit={saveLink} className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Category
            <select name="type" defaultValue={formValues.type} className="h-10 rounded-md border border-slate-300 bg-white px-3" required>
              {linkTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Button label
            <Input name="label" defaultValue={formValues.label} maxLength={80} placeholder="e.g. Haircut services" required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
            Destination URL or phone
            <Input name="url" defaultValue={formValues.url} maxLength={500} placeholder="https://... or tel:+1..." required />
          </label>
          <input type="hidden" name="icon" value={formValues.icon} />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : editingLink ? "Save changes" : "Add to smart page"}</Button>
            <Button type="button" variant="outline" onClick={closeForm} disabled={isPending}>
              <X size={16} aria-hidden="true" /> Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {links.length ? links.map((link) => (
        <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{link.label}</p>
            <p className="text-xs text-slate-500">{link.type}</p>
            <p className="truncate text-sm text-slate-600">{link.url}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => openEditForm(link)} disabled={isPending} aria-label={`Edit ${link.label}`}>
              <Pencil size={15} aria-hidden="true" /> Edit
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => removeLink(link)} disabled={isPending} aria-label={`Remove ${link.label}`}>
              <Trash2 size={15} aria-hidden="true" /> Remove
            </Button>
          </div>
        </div>
      )) : <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No services or links yet. Add one to publish it on this smart page.</p>}
    </div>
  );
}