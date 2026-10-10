export type BusinessRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  address: string;
  website: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SmartTagRecord = {
  id: string;
  businessId: string;
  code: string;
  name: string;
  location: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessLinkRecord = {
  id: string;
  businessId: string;
  type: string;
  label: string;
  url: string;
  icon: string;
  position: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PromotionRecord = {
  id: string;
  businessId: string;
  title: string;
  description: string;
  imageUrl?: string;
  destinationUrl?: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type InteractionRecord = {
  id: string;
  businessId: string;
  smartTagId?: string;
  businessLinkId?: string;
  eventType: "PAGE_VIEW" | "LINK_CLICK" | "PROMOTION_CLICK";
  source: "NFC" | "QR" | "UNKNOWN";
  createdAt: string;
};

export type DemoStore = {
  businesses: BusinessRecord[];
  tags: SmartTagRecord[];
  links: BusinessLinkRecord[];
  promotions: PromotionRecord[];
  interactions: InteractionRecord[];
};

const now = new Date();
const iso = (value: number) => new Date(value).toISOString();

const demoBusinessOne: BusinessRecord = {
  id: "biz-1",
  name: "Sunset Bistro",
  slug: "sunset-bistro",
  description: "A neighborhood bistro serving seasonal plates, handcrafted cocktails, and cozy evenings.",
  logoUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=200&q=80",
  primaryColor: "#ea580c",
  secondaryColor: "#fbbf24",
  phone: "+1 (415) 555-0199",
  address: "241 Harbor Way, San Francisco, CA",
  website: "https://sunsetbistro.example",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 10),
};

const demoBusinessTwo: BusinessRecord = {
  id: "biz-2",
  name: "Luna Nail Studio",
  slug: "luna-nail-studio",
  description: "Premium nail art, skincare rituals, and signature self-care experiences.",
  logoUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=200&q=80",
  primaryColor: "#ec4899",
  secondaryColor: "#f9a8d4",
  phone: "+1 (212) 555-0134",
  address: "17 Orchard Lane, New York, NY",
  website: "https://lunanails.example",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 41),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8),
};

const demoBusinessThree: BusinessRecord = {
  id: "biz-3",
  name: "Forge & Fade",
  slug: "forge-and-fade",
  description: "Classic cuts, beard work, and modern grooming in a relaxed barbershop setting.",
  logoUrl: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=200&q=80",
  primaryColor: "#1f2937",
  secondaryColor: "#f59e0b",
  phone: "+1 (312) 555-0102",
  address: "870 W Madison St, Chicago, IL",
  website: "https://forgeandfade.example",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 20),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 7),
};

const store: DemoStore = {
  businesses: [demoBusinessOne, demoBusinessTwo, demoBusinessThree],
  tags: [
    { id: "tag-1", businessId: "biz-1", code: "A7K92", name: "Main table", location: "Front counter", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 25), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 12) },
    { id: "tag-2", businessId: "biz-2", code: "N8L21", name: "Reception desk", location: "Checkout desk", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 18), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 6) },
    { id: "tag-3", businessId: "biz-3", code: "R2Q09", name: "Barber chair", location: "Waiting area", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 15), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 5) },
  ],
  links: [
    { id: "link-1", businessId: "biz-1", type: "MENU", label: "View Menu", url: "https://example.com/menu", icon: "utensils", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-2", businessId: "biz-1", type: "REVIEWS", label: "Google Reviews", url: "https://example.com/reviews", icon: "star", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-3", businessId: "biz-1", type: "RESERVATION", label: "Reserve a Table", url: "https://example.com/reserve", icon: "calendar", position: 3, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-4", businessId: "biz-2", type: "BOOKING", label: "Book Appointment", url: "https://example.com/book", icon: "calendar-check", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-5", businessId: "biz-2", type: "INSTAGRAM", label: "Instagram", url: "https://instagram.com", icon: "instagram", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-6", businessId: "biz-3", type: "WHATSAPP", label: "WhatsApp", url: "https://wa.me/15555550102", icon: "message-circle", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-7", businessId: "biz-3", type: "CUSTOM", label: "Gift Card", url: "https://example.com/gift", icon: "gift", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
  ],
  promotions: [
    { id: "promo-1", businessId: "biz-1", title: "Sunset Supper Club", description: "Two-course dinner with a free dessert for late-night reservations.", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80", destinationUrl: "https://example.com/specials", active: true, startsAt: iso(now.getTime() - 1000 * 60 * 60 * 8), endsAt: iso(now.getTime() + 1000 * 60 * 60 * 24 * 20) },
    { id: "promo-2", businessId: "biz-2", title: "Signature Soft Gel Set", description: "Book any premium manicure and save 15% this week.", imageUrl: "https://images.unsplash.com/photo-1521590832167-7ae9b3c0220a?auto=format&fit=crop&w=900&q=80", destinationUrl: "https://example.com/sale", active: true, startsAt: iso(now.getTime() - 1000 * 60 * 60 * 2), endsAt: iso(now.getTime() + 1000 * 60 * 60 * 24 * 9) },
  ],
  interactions: [
    { id: "int-1", businessId: "biz-1", smartTagId: "tag-1", eventType: "PAGE_VIEW", source: "QR", createdAt: iso(now.getTime() - 1000 * 60 * 60 * 26) },
    { id: "int-2", businessId: "biz-1", smartTagId: "tag-1", businessLinkId: "link-1", eventType: "LINK_CLICK", source: "NFC", createdAt: iso(now.getTime() - 1000 * 60 * 60 * 20) },
    { id: "int-3", businessId: "biz-2", smartTagId: "tag-2", eventType: "PAGE_VIEW", source: "QR", createdAt: iso(now.getTime() - 1000 * 60 * 60 * 44) },
    { id: "int-4", businessId: "biz-2", smartTagId: "tag-2", businessLinkId: "link-4", eventType: "LINK_CLICK", source: "NFC", createdAt: iso(now.getTime() - 1000 * 60 * 60 * 16) },
    { id: "int-5", businessId: "biz-3", smartTagId: "tag-3", eventType: "PAGE_VIEW", source: "QR", createdAt: iso(now.getTime() - 1000 * 60 * 60 * 13) },
  ],
};

export function getDemoStore() {
  return store;
}

export function getBusinessById(id: string) {
  return store.businesses.find((business) => business.id === id);
}

export function getBusinessBySlug(slug: string) {
  return store.businesses.find((business) => business.slug === slug);
}

export function getTagByCode(code: string) {
  return store.tags.find((tag) => tag.code === code.toUpperCase());
}

export function getBusinessLinks(businessId: string) {
  return store.links
    .filter((link) => link.businessId === businessId && link.active)
    .sort((a, b) => a.position - b.position);
}

export function getBusinessPromotions(businessId: string) {
  return store.promotions.filter((promo) => promo.businessId === businessId && promo.active);
}

export function recordInteraction(args: {
  businessId: string;
  smartTagId?: string;
  businessLinkId?: string;
  eventType: "PAGE_VIEW" | "LINK_CLICK" | "PROMOTION_CLICK";
  source?: "NFC" | "QR" | "UNKNOWN";
}) {
  const interaction: InteractionRecord = {
    id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    businessId: args.businessId,
    smartTagId: args.smartTagId,
    businessLinkId: args.businessLinkId,
    eventType: args.eventType,
    source: args.source ?? "UNKNOWN",
    createdAt: new Date().toISOString(),
  };

  store.interactions.unshift(interaction);
  return interaction;
}

export function createBusiness(input: Partial<BusinessRecord>) {
  const business: BusinessRecord = {
    id: `biz-${Date.now()}`,
    name: input.name ?? "New Business",
    slug: input.slug ?? `business-${Date.now()}`,
    description: input.description ?? "",
    logoUrl: input.logoUrl,
    primaryColor: input.primaryColor ?? "#0f172a",
    secondaryColor: input.secondaryColor ?? "#f97316",
    phone: input.phone ?? "",
    address: input.address ?? "",
    website: input.website ?? "",
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.businesses.push(business);
  return business;
}

export function updateBusiness(id: string, input: Partial<BusinessRecord>) {
  const idx = store.businesses.findIndex((business) => business.id === id);
  if (idx === -1) return null;

  const existing = store.businesses[idx];
  store.businesses[idx] = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  return store.businesses[idx];
}

export function createTag(input: Partial<SmartTagRecord>) {
  const generatedCode = input.code ?? `TAG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const tag: SmartTagRecord = {
    id: `tag-${Date.now()}`,
    businessId: input.businessId ?? "biz-1",
    code: generatedCode,
    name: input.name ?? "Smart Tag",
    location: input.location ?? "",
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.tags.push(tag);
  return tag;
}

export function updateTag(id: string, input: Partial<SmartTagRecord>) {
  const idx = store.tags.findIndex((tag) => tag.id === id);
  if (idx === -1) return null;

  const existing = store.tags[idx];
  store.tags[idx] = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  return store.tags[idx];
}

export function createLink(input: Partial<BusinessLinkRecord>) {
  const link: BusinessLinkRecord = {
    id: `link-${Date.now()}`,
    businessId: input.businessId ?? "biz-1",
    type: input.type ?? "CUSTOM",
    label: input.label ?? "New Link",
    url: input.url ?? "https://example.com",
    icon: input.icon ?? "link",
    position: input.position ?? 0,
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.links.push(link);
  return link;
}

export function updateLink(id: string, input: Partial<BusinessLinkRecord>) {
  const idx = store.links.findIndex((link) => link.id === id);
  if (idx === -1) return null;

  const existing = store.links[idx];
  store.links[idx] = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  return store.links[idx];
}

export function deleteLink(id: string) {
  const idx = store.links.findIndex((link) => link.id === id);
  if (idx === -1) return false;
  store.links.splice(idx, 1);
  return true;
}

export function resolveSmartTag(code: string) {
  const normalized = code.toUpperCase();
  const tag = store.tags.find((item) => item.code === normalized && item.active);
  if (!tag) return null;

  const business = getBusinessById(tag.businessId);
  return { tag, business };
}
