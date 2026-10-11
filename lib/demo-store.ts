import { type Business, type BusinessLink, type Interaction, type Promotion, type SmartTag, EventType as PrismaEventType, LinkType as PrismaLinkType, SourceType as PrismaSourceType } from "@prisma/client";

import { isDemoModeEnabled } from "@/lib/env";
import { prisma } from "@/lib/prisma";

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
  tagLinkAssignments: { smartTagId: string; businessLinkId: string }[];
  promotions: PromotionRecord[];
  interactions: InteractionRecord[];
};

const now = new Date();
const iso = (value: number) => new Date(value).toISOString();

const demoBusinessOne: BusinessRecord = {
  id: "biz-1",
  name: "Columbia Restaurant - Ybor City",
  slug: "columbia-restaurant-ybor-city",
  description: "The original Columbia Restaurant in Tampa's historic Ybor City, serving Spanish and Cuban cuisine.",
  primaryColor: "#8b1e24",
  secondaryColor: "#d4a64a",
  phone: "+1 (813) 248-4961",
  address: "2117 E. 7th Ave., Tampa, FL 33605",
  website: "https://www.columbiarestaurant.com/ybor-city-tampa",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 10),
};

const demoBusinessTwo: BusinessRecord = {
  id: "biz-2",
  name: "Ulele",
  slug: "ulele-tampa",
  description: "Tampa restaurant serving native-inspired food and spirits made with ingredients from Florida waters and land.",
  primaryColor: "#286c68",
  secondaryColor: "#d39b4a",
  phone: "+1 (813) 999-4952",
  address: "1810 N. Highland Ave., Tampa, FL 33602",
  website: "https://ulele.com/",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 41),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8),
};

const demoBusinessThree: BusinessRecord = {
  id: "biz-3",
  name: "The Ravenous Pig",
  slug: "the-ravenous-pig-winter-park",
  description: "A Winter Park restaurant featuring seasonal American cuisine and a menu that changes daily.",
  primaryColor: "#41433c",
  secondaryColor: "#c8663a",
  phone: "+1 (407) 628-2333",
  address: "565 W. Fairbanks Ave., Winter Park, FL 32789",
  website: "https://www.theravenouspig.com/",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 20),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 7),
};

const demoBusinessFour: BusinessRecord = {
  id: "biz-4",
  name: "Tampa Nails",
  slug: "tampa-nails-westshore",
  description: "Nail salon in Tampa's Westshore area offering manicures, pedicures, and other beauty services.",
  primaryColor: "#b85375",
  secondaryColor: "#e5ae87",
  phone: "+1 (813) 513-8600",
  address: "4734 W Cypress St, Tampa, FL 33607",
  website: "https://tampanails.com/",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 12),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 4),
};

const demoBusinessFive: BusinessRecord = {
  id: "biz-5",
  name: "Tampa Spa & Nails",
  slug: "tampa-spa-and-nails",
  description: "Tampa nail salon offering manicures, pedicures, nail art, and waxing services.",
  primaryColor: "#c16a79",
  secondaryColor: "#e4b983",
  phone: "+1 (813) 497-8900",
  address: "3018 W Kennedy Blvd, Tampa, FL 33609",
  website: "https://tampaspanails.com/",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 9),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 3),
};

const demoBusinessSix: BusinessRecord = {
  id: "biz-6",
  name: "Barber & Co. - Gasworx",
  slug: "barber-and-co-gasworx",
  description: "Tampa barbershop at Gold's Gym Gasworx offering haircuts, beard trims, shaves, and grooming packages.",
  primaryColor: "#343d42",
  secondaryColor: "#c59a55",
  phone: "+1 (813) 625-4762",
  address: "802 N 12th Street, Tampa, FL 33602",
  website: "https://www.barbercotampa.com/",
  active: true,
  createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 6),
  updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 2),
};

const store: DemoStore = {
  businesses: [demoBusinessOne, demoBusinessTwo, demoBusinessThree, demoBusinessFour, demoBusinessFive, demoBusinessSix],
  tags: [
    { id: "tag-1", businessId: "biz-1", code: "A7K92", name: "Columbia Ybor City", location: "Tampa, Florida", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 25), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 12) },
    { id: "tag-2", businessId: "biz-2", code: "N8L21", name: "Ulele Tampa", location: "Tampa, Florida", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 18), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 6) },
    { id: "tag-3", businessId: "biz-3", code: "R2Q09", name: "The Ravenous Pig", location: "Winter Park, Florida", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 15), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 5) },
    { id: "tag-4", businessId: "biz-4", code: "TN6A82", name: "Tampa Nails - Westshore", location: "Tampa, Florida", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 12), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 4) },
    { id: "tag-5", businessId: "biz-5", code: "TS4P91", name: "Tampa Spa & Nails", location: "Tampa, Florida", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 9), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 3) },
    { id: "tag-6", businessId: "biz-6", code: "BC7G53", name: "Barber & Co. Gasworx", location: "Tampa, Florida", active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 6), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 2) },
  ],
  links: [
    { id: "link-1", businessId: "biz-1", type: "MENU", label: "Official Dinner Menu", url: "https://www.columbiarestaurant.com/_files/ugd/28e529_55b4395ee05445c0acdf7f673686322e.pdf", icon: "utensils", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-2", businessId: "biz-1", type: "PHONE", label: "Call Columbia Ybor City", url: "tel:+18132484961", icon: "phone", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-3", businessId: "biz-1", type: "RESERVATION", label: "Make a Reservation", url: "https://www.opentable.com/columbia-restaurant-ybor-city-reservations-tampa", icon: "calendar", position: 3, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-4", businessId: "biz-2", type: "MENU", label: "Official Menus", url: "https://ulele.com/menus/", icon: "utensils", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-5", businessId: "biz-2", type: "PHONE", label: "Call Ulele", url: "tel:+18139994952", icon: "phone", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-6", businessId: "biz-2", type: "RESERVATION", label: "Make a Reservation", url: "https://www.opentable.com/ulele-reservations-tampa", icon: "calendar", position: 3, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-7", businessId: "biz-3", type: "MENU", label: "Official Menu", url: "https://www.theravenouspig.com/menu", icon: "utensils", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-8", businessId: "biz-3", type: "PHONE", label: "Call The Ravenous Pig", url: "tel:+14076282333", icon: "phone", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-9", businessId: "biz-3", type: "WEBSITE", label: "Contact The Ravenous Pig", url: "https://www.theravenouspig.com/contact", icon: "globe", position: 3, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 30), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 8) },
    { id: "link-10", businessId: "biz-4", type: "MENU", label: "Services Menu", url: "https://tampanails.com/services/", icon: "sparkles", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 12), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 4) },
    { id: "link-11", businessId: "biz-4", type: "BOOKING", label: "Book an Appointment", url: "https://booking.gocheckin.net/v2/13064", icon: "calendar", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 12), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 4) },
    { id: "link-12", businessId: "biz-4", type: "PHONE", label: "Call Tampa Nails", url: "tel:+18135138600", icon: "phone", position: 3, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 12), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 4) },
    { id: "link-13", businessId: "biz-5", type: "MENU", label: "Services Menu", url: "https://tampaspanails.com/services", icon: "sparkles", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 9), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 3) },
    { id: "link-14", businessId: "biz-5", type: "BOOKING", label: "Book an Appointment", url: "https://lk.macmarketing.us/Tampa33609-Booking", icon: "calendar", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 9), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 3) },
    { id: "link-15", businessId: "biz-5", type: "PHONE", label: "Call Tampa Spa & Nails", url: "tel:+18134978900", icon: "phone", position: 3, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 9), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 3) },
    { id: "link-16", businessId: "biz-6", type: "CUSTOM", label: "Services and Pricing", url: "https://www.barbercotampa.com/", icon: "scissors", position: 1, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 6), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 2) },
    { id: "link-17", businessId: "biz-6", type: "BOOKING", label: "Book an Appointment", url: "https://www.barbercotampa.com/team", icon: "calendar", position: 2, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 6), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 2) },
    { id: "link-18", businessId: "biz-6", type: "PHONE", label: "Call Barber & Co.", url: "tel:+18136254762", icon: "phone", position: 3, active: true, createdAt: iso(now.getTime() - 1000 * 60 * 60 * 24 * 6), updatedAt: iso(now.getTime() - 1000 * 60 * 60 * 2) },
  ],
  tagLinkAssignments: [],
  promotions: [],
  interactions: [],
};

store.tagLinkAssignments = store.tags.flatMap((tag) =>
  store.links
    .filter((link) => link.businessId === tag.businessId && link.active)
    .map((link) => ({ smartTagId: tag.id, businessLinkId: link.id })),
);

function toBusinessRecord(record: Business): BusinessRecord {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description ?? "",
    logoUrl: record.logoUrl ?? undefined,
    primaryColor: record.primaryColor ?? "#0f172a",
    secondaryColor: record.secondaryColor ?? "#f97316",
    phone: record.phone ?? "",
    address: record.address ?? "",
    website: record.website ?? "",
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toSmartTagRecord(record: SmartTag): SmartTagRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    code: record.code,
    name: record.name ?? "",
    location: record.location ?? "",
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toBusinessLinkRecord(record: BusinessLink): BusinessLinkRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    type: record.type,
    label: record.label,
    url: record.url,
    icon: record.icon ?? "link",
    position: record.position,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPromotionRecord(record: Promotion): PromotionRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    title: record.title,
    description: record.description ?? "",
    imageUrl: record.imageUrl ?? undefined,
    destinationUrl: record.destinationUrl ?? undefined,
    active: record.active,
    startsAt: record.startsAt?.toISOString(),
    endsAt: record.endsAt?.toISOString(),
  };
}

function toInteractionRecord(record: Interaction): InteractionRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    smartTagId: record.smartTagId ?? undefined,
    businessLinkId: record.businessLinkId ?? undefined,
    eventType: record.eventType as InteractionRecord["eventType"],
    source: record.source as InteractionRecord["source"],
    createdAt: record.createdAt.toISOString(),
  };
}

async function getDbStore(): Promise<DemoStore> {
  const [businesses, tags, links, tagLinkAssignments, promotions] = await Promise.all([
    prisma.business.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.smartTag.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.businessLink.findMany({ orderBy: [{ businessId: "asc" }, { position: "asc" }] }),
    prisma.smartTagLink.findMany({ select: { smartTagId: true, businessLinkId: true } }),
    prisma.promotion.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return {
    businesses: businesses.map(toBusinessRecord),
    tags: tags.map(toSmartTagRecord),
    links: links.map(toBusinessLinkRecord),
    tagLinkAssignments,
    promotions: promotions.map(toPromotionRecord),
    interactions: [],
  };
}

export async function getDemoStore() {
  return isDemoModeEnabled() ? store : await getDbStore();
}

export async function getBusinessById(id: string) {
  if (!isDemoModeEnabled()) {
    const business = await prisma.business.findUnique({ where: { id } });
    return business ? toBusinessRecord(business) : null;
  }

  return store.businesses.find((business) => business.id === id) ?? null;
}

export async function getBusinessBySlug(slug: string) {
  if (!isDemoModeEnabled()) {
    const business = await prisma.business.findUnique({ where: { slug } });
    return business ? toBusinessRecord(business) : null;
  }

  return store.businesses.find((business) => business.slug === slug) ?? null;
}

export async function getTagByCode(code: string) {
  if (!isDemoModeEnabled()) {
    const tag = await prisma.smartTag.findUnique({ where: { code: code.toUpperCase() } });
    return tag ? toSmartTagRecord(tag) : null;
  }

  return store.tags.find((tag) => tag.code === code.toUpperCase()) ?? null;
}

export async function getBusinessLinks(businessId: string) {
  if (!isDemoModeEnabled()) {
    const links = await prisma.businessLink.findMany({
      where: { businessId, active: true },
      orderBy: { position: "asc" },
    });

    return links.map(toBusinessLinkRecord);
  }

  return store.links
    .filter((link) => link.businessId === businessId && link.active)
    .sort((a, b) => a.position - b.position);
}

export async function getTagBusinessLinks(tagId: string, businessId: string) {
  if (!isDemoModeEnabled()) {
    const links = await prisma.businessLink.findMany({
      where: {
        businessId,
        active: true,
        tagAssignments: { some: { smartTagId: tagId } },
      },
      orderBy: { position: "asc" },
    });

    return links.map(toBusinessLinkRecord);
  }

  const assignedLinkIds = new Set(
    store.tagLinkAssignments
      .filter((assignment) => assignment.smartTagId === tagId)
      .map((assignment) => assignment.businessLinkId),
  );
  return store.links
    .filter((link) => link.businessId === businessId && link.active && assignedLinkIds.has(link.id))
    .sort((a, b) => a.position - b.position);
}

export async function setSmartTagLinkAssignments(tagId: string, linkIds: string[]) {
  if (!isDemoModeEnabled()) {
    await prisma.$transaction(async (transaction) => {
      await transaction.smartTagLink.deleteMany({ where: { smartTagId: tagId } });
      if (linkIds.length) {
        await transaction.smartTagLink.createMany({
          data: linkIds.map((businessLinkId) => ({ smartTagId: tagId, businessLinkId })),
        });
      }
    });
    return;
  }

  store.tagLinkAssignments = store.tagLinkAssignments.filter((assignment) => assignment.smartTagId !== tagId);
  store.tagLinkAssignments.push(...linkIds.map((businessLinkId) => ({ smartTagId: tagId, businessLinkId })));
}

export async function getBusinessPromotions(businessId: string) {
  if (!isDemoModeEnabled()) {
    const promotions = await prisma.promotion.findMany({
      where: { businessId, active: true },
      orderBy: { createdAt: "desc" },
    });

    return promotions.map(toPromotionRecord);
  }

  return store.promotions.filter((promo) => promo.businessId === businessId && promo.active);
}

export async function recordInteraction(args: {
  businessId: string;
  smartTagId?: string;
  businessLinkId?: string;
  eventType: "PAGE_VIEW" | "LINK_CLICK" | "PROMOTION_CLICK";
  source?: "NFC" | "QR" | "UNKNOWN";
}) {
  if (!isDemoModeEnabled()) {
    const interaction = await prisma.interaction.create({
      data: {
        businessId: args.businessId,
        smartTagId: args.smartTagId ?? null,
        businessLinkId: args.businessLinkId ?? null,
        eventType: args.eventType as PrismaEventType,
        source: (args.source ?? "UNKNOWN") as PrismaSourceType,
      },
    });

    return toInteractionRecord(interaction);
  }

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

export async function createBusiness(input: Partial<BusinessRecord>) {
  if (!isDemoModeEnabled()) {
    const business = await prisma.business.create({
      data: {
        name: input.name ?? "New Business",
        slug: input.slug ?? `business-${Date.now()}`,
        description: input.description ?? "",
        logoUrl: input.logoUrl ?? null,
        primaryColor: input.primaryColor ?? "#0f172a",
        secondaryColor: input.secondaryColor ?? "#f97316",
        phone: input.phone ?? "",
        address: input.address ?? "",
        website: input.website ?? "",
        active: input.active ?? true,
      },
    });

    return toBusinessRecord(business);
  }

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

export async function updateBusiness(id: string, input: Partial<BusinessRecord>) {
  if (!isDemoModeEnabled()) {
    const business = await prisma.business.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        logoUrl: input.logoUrl ?? undefined,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        phone: input.phone,
        address: input.address,
        website: input.website,
        active: input.active,
      },
    });

    return toBusinessRecord(business);
  }

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

export async function deleteBusiness(id: string) {
  if (!isDemoModeEnabled()) {
    await prisma.business.delete({ where: { id } });
    return true;
  }

  const business = store.businesses.find((item) => item.id === id);
  if (!business) return false;

  const tagIds = new Set(store.tags.filter((tag) => tag.businessId === id).map((tag) => tag.id));
  const linkIds = new Set(store.links.filter((link) => link.businessId === id).map((link) => link.id));
  store.businesses = store.businesses.filter((item) => item.id !== id);
  store.tags = store.tags.filter((tag) => tag.businessId !== id);
  store.links = store.links.filter((link) => link.businessId !== id);
  store.promotions = store.promotions.filter((promotion) => promotion.businessId !== id);
  store.interactions = store.interactions.filter((interaction) => interaction.businessId !== id);
  store.tagLinkAssignments = store.tagLinkAssignments.filter((assignment) =>
    !tagIds.has(assignment.smartTagId) && !linkIds.has(assignment.businessLinkId),
  );
  return true;
}

export async function createTag(input: Partial<SmartTagRecord>) {
  if (!isDemoModeEnabled()) {
    const tag = await prisma.$transaction(async (transaction) => {
      const createdTag = await transaction.smartTag.create({
        data: {
          businessId: input.businessId ?? "",
          code: input.code ?? `TAG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          name: input.name ?? "Smart Tag",
          location: input.location ?? "",
          active: input.active ?? true,
        },
      });
      const links = await transaction.businessLink.findMany({
        where: { businessId: createdTag.businessId, active: true },
        select: { id: true },
      });
      if (links.length) {
        await transaction.smartTagLink.createMany({
          data: links.map((link) => ({ smartTagId: createdTag.id, businessLinkId: link.id })),
        });
      }
      return createdTag;
    });

    return toSmartTagRecord(tag);
  }

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
  store.tagLinkAssignments.push(
    ...store.links
      .filter((link) => link.businessId === tag.businessId && link.active)
      .map((link) => ({ smartTagId: tag.id, businessLinkId: link.id })),
  );
  return tag;
}

export async function updateTag(id: string, input: Partial<SmartTagRecord>) {
  if (!isDemoModeEnabled()) {
    const tag = await prisma.smartTag.update({
      where: { id },
      data: {
        businessId: input.businessId,
        code: input.code,
        name: input.name,
        location: input.location,
        active: input.active,
      },
    });

    return toSmartTagRecord(tag);
  }

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

export async function deleteTag(id: string) {
  if (!isDemoModeEnabled()) {
    await prisma.smartTag.delete({ where: { id } });
    return true;
  }

  const idx = store.tags.findIndex((tag) => tag.id === id);
  if (idx === -1) return false;
  store.tags.splice(idx, 1);
  store.tagLinkAssignments = store.tagLinkAssignments.filter((assignment) => assignment.smartTagId !== id);
  store.interactions = store.interactions.map((interaction) =>
    interaction.smartTagId === id ? { ...interaction, smartTagId: undefined } : interaction,
  );
  return true;
}

export async function createLink(input: Partial<BusinessLinkRecord>) {
  if (!isDemoModeEnabled()) {
    const link = await prisma.businessLink.create({
      data: {
        businessId: input.businessId ?? "",
        type: (input.type ?? "CUSTOM") as PrismaLinkType,
        label: input.label ?? "New Link",
        url: input.url ?? "https://example.com",
        icon: input.icon ?? "link",
        position: input.position ?? 0,
        active: input.active ?? true,
      },
    });

    return toBusinessLinkRecord(link);
  }

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

export async function updateLink(id: string, input: Partial<BusinessLinkRecord>) {
  if (!isDemoModeEnabled()) {
    const link = await prisma.businessLink.update({
      where: { id },
      data: {
        businessId: input.businessId,
        type: input.type ? (input.type as PrismaLinkType) : undefined,
        label: input.label,
        url: input.url,
        icon: input.icon,
        position: input.position,
        active: input.active,
      },
    });

    return toBusinessLinkRecord(link);
  }

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

export async function deleteLink(id: string) {
  if (!isDemoModeEnabled()) {
    await prisma.businessLink.delete({ where: { id } });
    return true;
  }

  const idx = store.links.findIndex((link) => link.id === id);
  if (idx === -1) return false;
  store.links.splice(idx, 1);
  store.tagLinkAssignments = store.tagLinkAssignments.filter((assignment) => assignment.businessLinkId !== id);
  return true;
}

export async function resolveSmartTag(code: string) {
  const normalized = code.toUpperCase();

  if (!isDemoModeEnabled()) {
    const tag = await getTagByCode(normalized);
    if (!tag || !tag.active) return null;

    const business = await getBusinessById(tag.businessId);
    return { tag, business };
  }

  const tag = store.tags.find((item) => item.code === normalized && item.active);
  if (!tag) return null;

  const business = await getBusinessById(tag.businessId);
  return { tag, business };
}
