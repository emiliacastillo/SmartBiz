import {
  type Business,
  type BusinessLink,
  type Interaction,
  type Promotion,
  type SmartTag,
  EventType as PrismaEventType,
  LinkType as PrismaLinkType,
  SourceType as PrismaSourceType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { serviceImagesSchema, serviceActionsSchema, type ServiceImage, type ServiceAction } from "@/lib/service-content";

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
  description: string;
  images: ServiceImage[];
  actions: ServiceAction[];
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
  eventType: "PAGE_VIEW" | "LINK_CLICK" | "PROMOTION_CLICK" | "SERVICE_VIEW" | "IMAGE_VIEW" | "IMAGE_EXPAND";
  source: "NFC" | "QR" | "UNKNOWN";
  createdAt: string;
};

export type AppStore = {
  businesses: BusinessRecord[];
  tags: SmartTagRecord[];
  links: BusinessLinkRecord[];
  tagLinkAssignments: { smartTagId: string; businessLinkId: string }[];
  promotions: PromotionRecord[];
  interactions: InteractionRecord[];
};

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
    description: record.description ?? "",
    images: serviceImagesSchema.parse(record.images ?? []),
    actions: serviceActionsSchema.parse(record.actions ?? []),
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

export async function getAppStore(): Promise<AppStore> {
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

export async function getBusinessById(id: string): Promise<BusinessRecord | null> {
  const business = await prisma.business.findUnique({ where: { id } });
  return business ? toBusinessRecord(business) : null;
}

export async function getBusinessBySlug(slug: string): Promise<BusinessRecord | null> {
  const business = await prisma.business.findUnique({ where: { slug } });
  return business ? toBusinessRecord(business) : null;
}

export async function getTagByCode(code: string): Promise<SmartTagRecord | null> {
  const tag = await prisma.smartTag.findUnique({ where: { code: code.toUpperCase() } });
  return tag ? toSmartTagRecord(tag) : null;
}

export async function getBusinessLinks(businessId: string): Promise<BusinessLinkRecord[]> {
  const links = await prisma.businessLink.findMany({
    where: { businessId, active: true },
    orderBy: { position: "asc" },
  });
  return links.map(toBusinessLinkRecord);
}

export async function getTagBusinessLinks(tagId: string, businessId: string): Promise<BusinessLinkRecord[]> {
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

export async function setSmartTagLinkAssignments(tagId: string, linkIds: string[]): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.smartTagLink.deleteMany({ where: { smartTagId: tagId } });
    if (linkIds.length) {
      await transaction.smartTagLink.createMany({
        data: linkIds.map((businessLinkId) => ({ smartTagId: tagId, businessLinkId })),
      });
    }
  });
}

export async function getBusinessPromotions(businessId: string): Promise<PromotionRecord[]> {
  const promotions = await prisma.promotion.findMany({
    where: { businessId, active: true },
    orderBy: { createdAt: "desc" },
  });
  return promotions.map(toPromotionRecord);
}

export async function recordInteraction(args: {
  businessId: string;
  smartTagId?: string;
  businessLinkId?: string;
  eventType: InteractionRecord["eventType"];
  source?: InteractionRecord["source"];
  informationType?: string;
  targetId?: string;
}): Promise<InteractionRecord> {
  const interaction = await prisma.interaction.create({
    data: {
      businessId: args.businessId,
      smartTagId: args.smartTagId ?? null,
      businessLinkId: args.businessLinkId ?? null,
      eventType: args.eventType as PrismaEventType,
      source: (args.source ?? "UNKNOWN") as PrismaSourceType,
      ...(args.informationType ? { informationType: args.informationType } : {}),
      ...(args.targetId ? { targetId: args.targetId } : {}),
    },
  });
  return toInteractionRecord(interaction);
}

export async function createBusiness(input: Partial<BusinessRecord>): Promise<BusinessRecord> {
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

export async function updateBusiness(id: string, input: Partial<BusinessRecord>): Promise<BusinessRecord> {
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

export async function deleteBusiness(id: string): Promise<void> {
  await prisma.business.delete({ where: { id } });
}

export async function createTag(input: Partial<SmartTagRecord>): Promise<SmartTagRecord> {
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

export async function updateTag(id: string, input: Partial<SmartTagRecord>): Promise<SmartTagRecord> {
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

export async function deleteTag(id: string): Promise<void> {
  await prisma.smartTag.delete({ where: { id } });
}

export async function createLink(input: Partial<BusinessLinkRecord>): Promise<BusinessLinkRecord> {
  const link = await prisma.businessLink.create({
    data: {
      businessId: input.businessId ?? "",
      type: (input.type ?? "CUSTOM") as PrismaLinkType,
      label: input.label ?? "New Link",
      url: input.url ?? "",
      description: input.description ?? "",
      images: input.images ?? [],
      actions: input.actions ?? [],
      icon: input.icon ?? "link",
      position: input.position ?? 0,
      active: input.active ?? true,
    },
  });
  return toBusinessLinkRecord(link);
}

export async function updateLink(id: string, input: Partial<BusinessLinkRecord>): Promise<BusinessLinkRecord> {
  const link = await prisma.businessLink.update({
    where: { id },
    data: {
      businessId: input.businessId,
      type: input.type ? (input.type as PrismaLinkType) : undefined,
      label: input.label,
      url: input.url,
      description: input.description,
      images: input.images,
      actions: input.actions,
      icon: input.icon,
      position: input.position,
      active: input.active,
    },
  });
  return toBusinessLinkRecord(link);
}

export async function deleteLink(id: string): Promise<void> {
  await prisma.businessLink.delete({ where: { id } });
}

export async function resolveSmartTag(code: string): Promise<{ tag: SmartTagRecord; business: BusinessRecord | null } | null> {
  const tag = await getTagByCode(code);
  if (!tag || !tag.active) return null;
  const business = await getBusinessById(tag.businessId);
  return { tag, business };
}
