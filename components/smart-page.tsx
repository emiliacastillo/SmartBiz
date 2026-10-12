import Image from "next/image";
import { ServiceCard } from "@/components/service-card";
import { CampaignCard } from "@/components/campaign-card";

import type { BusinessRecord, BusinessLinkRecord, PromotionRecord } from "@/lib/data-store";
import { ArrowUpRight, MapPin, Phone, Star, Globe, Sparkles, CalendarClock, Link2, Utensils, MessageCircle, Gift, CalendarCheck2, Scissors } from "lucide-react";

const iconMap: Record<string, typeof Link2> = {
  utensils: Utensils,
  star: Star,
  calendar: CalendarClock,
  instagram: Sparkles,
  message: MessageCircle,
  "calendar-check": CalendarCheck2,
  "message-circle": MessageCircle,
  phone: Phone,
  globe: Globe,
  sparkles: Sparkles,
  scissors: Scissors,
  gift: Gift,
  link: Link2,
};

function LinkIcon({ icon }: { icon: string }) {
  const Icon = iconMap[icon] ?? Link2;
  return <Icon size={18} />;
}

export function BusinessLogo({ business, className = "" }: { business: BusinessRecord; className?: string }) {
  return business.logoUrl ? (
    <Image src={business.logoUrl} alt={business.name} width={56} height={56} unoptimized className={`h-14 w-14 rounded-full object-cover ring-2 ring-white ${className}`} />
  ) : (
    <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white ${className}`}>
      {business.name.slice(0, 1)}
    </div>
  );
}

export function BusinessHeader({ business }: { business: BusinessRecord }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <BusinessLogo business={business} />
        <div>
          <p className="text-lg font-semibold text-slate-900">{business.name}</p>
          <p className="text-xs text-slate-500">Smart page</p>
        </div>
      </div>
      {business.phone ? (
        <a href={`tel:${business.phone}`} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white">
          Call
        </a>
      ) : null}
    </header>
  );
}

export function SmartLinkButton({
  link,
  tagCode,
  source,
}: {
  link: BusinessLinkRecord;
  tagCode?: string;
  source?: "nfc" | "qr" | "unknown";
}) {
  const href = link.url.startsWith("tel:")
    ? link.url
    : `/api/track/link?linkId=${link.id}&tagCode=${encodeURIComponent(tagCode ?? "")}&source=${source ?? "unknown"}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
          <LinkIcon icon={link.icon} />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{link.label}</p>
          <p className="text-xs text-slate-500">{link.type}</p>
        </div>
      </div>
      <ArrowUpRight className="text-slate-400" size={18} />
    </a>
  );
}

export function PromotionCard({
  promotion,
  tagCode,
  source,
}: {
  promotion: PromotionRecord;
  tagCode?: string;
  source?: "nfc" | "qr" | "unknown";
}) {
  const href = `/api/track/promotion?promoId=${promotion.id}&tagCode=${encodeURIComponent(tagCode ?? "")}&source=${source ?? "unknown"}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      {promotion.imageUrl ? <Image src={promotion.imageUrl} alt={promotion.title} width={800} height={240} unoptimized className="h-40 w-full object-cover" /> : null}
      <div className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Special offer</p>
        <h3 className="text-xl font-semibold text-slate-900">{promotion.title}</h3>
        <p className="text-sm text-slate-600">{promotion.description}</p>
      </div>
    </a>
  );
}

export function BusinessFooter({ business }: { business: BusinessRecord }) {
  return (
    <footer className="mt-6 border-t border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
      <div className="space-y-2">
        {business.address ? (
          <div className="flex items-center gap-2"><MapPin size={14} /> <span>{business.address}</span></div>
        ) : null}
        {business.phone ? (
          <div className="flex items-center gap-2"><Phone size={14} /> <a href={`tel:${business.phone}`} className="font-medium text-slate-700">{business.phone}</a></div>
        ) : null}
        {business.website ? (
          <div className="flex items-center gap-2"><Globe size={14} /> <a href={business.website} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700">Visit website</a></div>
        ) : null}
      </div>
    </footer>
  );
}

export function SmartPageLayout({
  business,
  links,
  promotions,
  tagCode,
  source,
  children,
}: {
  business: BusinessRecord;
  links: BusinessLinkRecord[];
  promotions: PromotionRecord[];
  tagCode?: string;
  source?: "nfc" | "qr" | "unknown";
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-md bg-white shadow-sm ring-1 ring-slate-200/80">
        <BusinessHeader business={business} />
        <main className="space-y-6 px-4 py-5">
          <div className="rounded-3xl px-4 py-5" style={{ background: `linear-gradient(135deg, ${business.primaryColor}, ${business.secondaryColor})` }}>
            <div className="flex items-center gap-4">
              <BusinessLogo business={business} className="h-16 w-16" />
              <div className="text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">Welcome</p>
                <h1 className="text-2xl font-semibold">{business.name}</h1>
              </div>
            </div>
          </div>

          {children}

          {promotions.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Rewards, events & offers</h2>
              <div className="space-y-3">
                {promotions.map((promotion) => (
                  <CampaignCard key={promotion.id} promotion={promotion} tagCode={tagCode} source={source} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            {links.map((link) => (
              <ServiceCard key={link.id} link={link} tagCode={tagCode} source={source} />
            ))}
          </section>
        </main>
        <BusinessFooter business={business} />
      </div>
    </div>
  );
}
