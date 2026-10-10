import { notFound } from "next/navigation";

import { SmartPageLayout } from "@/components/smart-page";
import { getBusinessById, getBusinessLinks, getBusinessPromotions, getTagByCode, recordInteraction } from "@/lib/demo-store";

export default async function SmartTagPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ src?: string }>;
}) {
  const { code } = await params;
  const query = searchParams ? await searchParams : {};
  const tag = getTagByCode(code);

  if (!tag || !tag.active) {
    notFound();
  }

  const business = getBusinessById(tag.businessId);
  if (!business || !business.active) {
    notFound();
  }

  recordInteraction({
    businessId: business.id,
    smartTagId: tag.id,
    eventType: "PAGE_VIEW",
    source: query.src === "nfc" ? "NFC" : query.src === "qr" ? "QR" : "UNKNOWN",
  });

  const links = getBusinessLinks(business.id);
  const promotions = getBusinessPromotions(business.id);

  const source = query.src === "nfc" ? "nfc" : query.src === "qr" ? "qr" : "unknown";

  return (
    <SmartPageLayout business={business} links={links} promotions={promotions} tagCode={tag.code} source={source}>
      <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Smart page</p>
        <h2 className="text-2xl font-semibold text-slate-900">{business.name}</h2>
        <p className="text-sm leading-6 text-slate-600">{business.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {business.address ? <span className="rounded-full bg-white px-2 py-1">{business.address}</span> : null}
          {business.phone ? <span className="rounded-full bg-white px-2 py-1">{business.phone}</span> : null}
        </div>
      </div>
    </SmartPageLayout>
  );
}
