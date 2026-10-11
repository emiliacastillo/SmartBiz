import { getAppStore } from "@/lib/data-store";

export async function resolveTrackedService(linkId: string, tagCode?: string) {
  const store = await getAppStore();
  const link = store.links.find((item) => item.id === linkId && item.active);
  if (!link || !store.businesses.some((business) => business.id === link.businessId && business.active)) return null;
  const tag = tagCode ? store.tags.find((item) => item.code === tagCode.toUpperCase() && item.active && item.businessId === link.businessId) : undefined;
  if (tagCode && (!tag || !store.tagLinkAssignments.some((item) => item.smartTagId === tag.id && item.businessLinkId === link.id))) return null;
  return { link, tag };
}
