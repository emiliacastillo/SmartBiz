"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Link2, Plus, QrCode, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { TagAdministrationControls } from "@/components/admin-crud-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BusinessLinkRecord, BusinessRecord, SmartTagRecord } from "@/lib/demo-store";

type BusinessFormData = {
  name: string;
  description: string;
  phone: string;
  address: string;
  website: string;
};

const emptyBusiness: BusinessFormData = {
  name: "",
  description: "",
  phone: "",
  address: "",
  website: "",
};

export function CreateBusinessForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      Object.keys(emptyBusiness).map((key) => [key, String(formData.get(key) ?? "").trim()]),
    );

    startTransition(async () => {
      try {
        const response = await fetch("/api/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to create the business.");
        setIsOpen(false);
        setError("");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to create the business.");
      }
    });
  }

  return (
    <section className="mb-8 border-b border-slate-200 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Business accounts</h2>
          <p className="mt-1 text-sm text-slate-600">Create a business profile, then assign it one or more smart tags.</p>
        </div>
        {!isOpen ? (
          <Button type="button" onClick={() => { setIsOpen(true); setError(""); }}>
            <Plus size={16} aria-hidden="true" /> Add business
          </Button>
        ) : null}
      </div>

      {error ? <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {isOpen ? (
        <form onSubmit={createBusiness} className="mt-4 grid gap-4 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Business name
            <Input name="name" minLength={2} maxLength={80} placeholder="Business name" required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Public phone
            <Input name="phone" maxLength={30} placeholder="+1 (813) 555-0100" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
            Description
            <Input name="description" maxLength={500} placeholder="What does this business offer?" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
            Public address
            <Input name="address" maxLength={250} placeholder="Street, city, state, ZIP" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
            Website
            <Input name="website" type="url" placeholder="https://example.com" />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create business"}</Button>
            <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setError(""); }} disabled={isPending}>
              <X size={16} aria-hidden="true" /> Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

export function BusinessTagManager({
  business,
  tags,
  links,
  assignments,
}: {
  business: BusinessRecord;
  tags: SmartTagRecord[];
  links: BusinessLinkRecord[];
  assignments: { smartTagId: string; businessLinkId: string }[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function createTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      businessId: business.id,
      name: String(formData.get("name") ?? "").trim(),
      code: String(formData.get("code") ?? "").trim() || undefined,
      location: String(formData.get("location") ?? "").trim(),
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to create the smart tag.");
        setIsOpen(false);
        setError("");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to create the smart tag.");
      }
    });
  }

  return (
    <section className="mt-5 border-t border-slate-200 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <QrCode size={16} aria-hidden="true" /> Smart tags ({tags.length})
        </div>
        {!isOpen ? (
          <Button type="button" size="sm" variant="outline" onClick={() => { setIsOpen(true); setError(""); }}>
            <Plus size={15} aria-hidden="true" /> Add tag
          </Button>
        ) : null}
      </div>

      {tags.length ? (
        <div className="mt-3 space-y-3">
          {tags.map((tag) => (
            <div key={tag.id} className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                <LinkTag tag={tag} />
                <TagAdministrationControls tag={tag} />
              </div>
              {tag.active ? (
                <TagLinkAssignmentManager
                  tag={tag}
                  links={links}
                  initialAssignedLinkIds={assignments.filter((assignment) => assignment.smartTagId === tag.id).map((assignment) => assignment.businessLinkId)}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : <p className="mt-3 text-sm text-slate-500">No tags assigned yet.</p>}

      {error ? <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {isOpen ? (
        <form onSubmit={createTag} className="mt-4 grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Tag name
            <Input name="name" minLength={2} maxLength={80} placeholder="Front entrance" required />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Code <span className="font-normal text-slate-500">(optional)</span>
            <Input name="code" minLength={4} maxLength={12} placeholder="Generated automatically" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Location <span className="font-normal text-slate-500">(optional)</span>
            <Input name="location" maxLength={120} placeholder="Tampa, Florida" />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-3">
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Creating..." : "Create tag"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setIsOpen(false); setError(""); }} disabled={isPending}>
              <X size={15} aria-hidden="true" /> Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function TagLinkAssignmentManager({
  tag,
  links,
  initialAssignedLinkIds,
}: {
  tag: SmartTagRecord;
  links: BusinessLinkRecord[];
  initialAssignedLinkIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [assignedLinkIds, setAssignedLinkIds] = useState(initialAssignedLinkIds);
  const [selectedLinkIds, setSelectedLinkIds] = useState(initialAssignedLinkIds);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleLink(linkId: string) {
    setSelectedLinkIds((current) => current.includes(linkId)
      ? current.filter((id) => id !== linkId)
      : [...current, linkId]);
  }

  function saveAssignments() {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/tags/${tag.id}/links`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkIds: selectedLinkIds }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to save service assignments.");
        setAssignedLinkIds(result.linkIds as string[]);
        setIsOpen(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save service assignments.");
      }
    });
  }

  return (
    <div className="w-full border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-slate-600">
          <Link2 size={14} aria-hidden="true" />
          {assignedLinkIds.length} of {links.length} services shown on this tag
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedLinkIds(assignedLinkIds);
            setError("");
            setIsOpen((open) => !open);
          }}
        >
          {isOpen ? "Close assignments" : "Assign services"}
        </Button>
      </div>

      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}

      {isOpen ? (
        <div className="mt-3 rounded-md bg-slate-50 p-3">
          {links.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {links.map((link) => (
                <label key={link.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedLinkIds.includes(link.id)}
                    onChange={() => toggleLink(link.id)}
                    disabled={isPending}
                    className="mt-0.5 h-4 w-4 accent-slate-900"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{link.label}</span>
                    <span className="block truncate text-xs text-slate-500">{link.type}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : <p className="text-sm text-slate-600">Add active services or links to this business first.</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={saveAssignments} disabled={isPending || !links.length}>
              <Save size={15} aria-hidden="true" /> {isPending ? "Saving..." : "Save assignments"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setIsOpen(false); setError(""); }} disabled={isPending}>
              <X size={15} aria-hidden="true" /> Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LinkTag({ tag }: { tag: SmartTagRecord }) {
  return (
    <a href={`/t/${tag.code}`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-400">
      <span className="font-medium">{tag.code}</span>
      <span className="text-slate-500">{tag.name || tag.location || "Smart tag"}</span>
      <span className={`h-2 w-2 rounded-full ${tag.active ? "bg-emerald-500" : "bg-slate-300"}`} aria-label={tag.active ? "Active" : "Inactive"} />
    </a>
  );
}