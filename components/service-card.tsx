"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { BusinessLinkRecord } from "@/lib/data-store";
import { actionLabels, isServiceDestination } from "@/lib/service-content";

export function ServiceCard({ link, tagCode, source = "unknown" }: {
  link: BusinessLinkRecord; tagCode?: string; source?: "nfc" | "qr" | "unknown";
}) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const image = link.images[index];
  function track(eventType: string, targetId?: string, imageId?: string) {
    void fetch("/api/track/service", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ linkId: link.id, tagCode, source, eventType, targetId, imageId }),
    }).catch(() => {});
  }
  function move(direction: number) {
    const next = (index + direction + link.images.length) % link.images.length;
    setIndex(next);
    track("IMAGE_VIEW", link.images[next].id);
  }
  const controls = link.images.length > 1 ? (
    <div className="flex items-center justify-between gap-3 p-3">
      <button type="button" onClick={() => move(-1)} aria-label={`Imagen anterior de ${link.label}`} className="rounded-lg border px-4 py-2">←</button>
      <span aria-live="polite">{index + 1} / {link.images.length}</span>
      <button type="button" onClick={() => move(1)} aria-label={`Imagen siguiente de ${link.label}`} className="rounded-lg border px-4 py-2">→</button>
    </div>
  ) : null;
  const imageActions = image?.actions?.length ? (
    <div className="flex flex-wrap gap-2 p-3" aria-label="Enlaces y contactos de esta imagen">
      {image.actions.map((action) => <a key={action.id} href={action.url}
        target={/^https?:/.test(action.url) ? "_blank" : undefined} rel="noopener noreferrer"
        onClick={() => track("LINK_CLICK", action.id, image.id)}
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm">
        {action.label}<span className="ml-2 text-xs text-slate-500">{actionLabels[action.type]}</span>
      </a>)}
    </div>
  ) : null;
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {image ? <section aria-label={`Galería de ${link.label}`} aria-roledescription="carrusel">
        <button type="button" className="block w-full" aria-label={`Ampliar imagen de ${link.label}`} onClick={() => { dialog.current?.showModal(); track("IMAGE_EXPAND", image.id); }}>
          <Image src={image.url} alt={image.description || link.label} width={800} height={500} unoptimized className="h-56 w-full object-cover" />
        </button>
        {controls}
        {image.description ? <p className="px-4 pb-3 text-sm text-slate-600">{image.description}</p> : null}
        {imageActions}
      </section> : null}
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">{link.label}</h3>
        {link.description ? <details onToggle={(event) => { if (event.currentTarget.open) track("SERVICE_VIEW"); }}>
          <summary className="cursor-pointer font-medium text-slate-700">Ver descripción</summary>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{link.description}</p>
        </details> : null}
        <div className="flex flex-wrap gap-2">
          {isServiceDestination(link.url) ? <a href={link.url} target={/^https?:/.test(link.url) ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => track("LINK_CLICK")} className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">{link.label} ↗</a> : null}
          {link.actions.map((action) => <a key={action.id} href={action.url} target={/^https?:/.test(action.url) ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => track("LINK_CLICK", action.id)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm">
            {action.label}<span className="ml-2 text-xs text-slate-500">{actionLabels[action.type]}</span>
          </a>)}
        </div>
      </div>
      <dialog ref={dialog} aria-label={`Imagen ampliada de ${link.label}`} className="m-auto max-h-[95dvh] w-[95vw] max-w-4xl overflow-auto rounded-2xl p-4 backdrop:bg-black/80">
        <button type="button" onClick={() => dialog.current?.close()} className="mb-3 rounded-lg border px-4 py-2">Cerrar imagen</button>
        {image ? <Image src={image.url} alt={image.description || link.label} width={1400} height={1000} unoptimized className="max-h-[70dvh] w-full object-contain" /> : null}
        {controls}
        <p>{image?.description}</p>
        {imageActions}
      </dialog>
    </article>
  );
}
