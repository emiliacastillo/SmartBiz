import { z } from "zod";

export const actionTypes = ["LINK", "PHONE", "EMAIL", "WHATSAPP", "SOCIAL", "STORE"] as const;
export const actionLabels: Record<(typeof actionTypes)[number], string> = {
  LINK: "Enlace", PHONE: "Teléfono", EMAIL: "Correo", WHATSAPP: "WhatsApp", SOCIAL: "Red social", STORE: "Tienda",
};

export function informationLabel(type: string) {
  const labels: Record<string, string> = { ...actionLabels, DESCRIPTION: "Descripción", IMAGE: "Imagen" };
  return type.startsWith("IMAGE_") ? `Imagen: ${labels[type.slice(6)] ?? type.slice(6)}` : labels[type] ?? type;
}

export function isServiceDestination(value: string) {
  if (/^(tel:\+?[\d ()-]+|mailto:[^\s@]+@[^\s@]+)$/i.test(value)) return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

export const serviceActionSchema = z.object({
  id: z.string().min(1).max(100), type: z.enum(actionTypes),
  label: z.string().trim().min(1).max(80),
  url: z.string().max(2000).refine(isServiceDestination, "Destino no válido"),
}).refine(({ type, url }) => type === "PHONE" ? url.startsWith("tel:")
  : type === "EMAIL" ? url.startsWith("mailto:") : /^https?:\/\//.test(url), "El destino no coincide con el tipo de acción");
export const serviceActionsSchema = z.array(serviceActionSchema).max(20).refine((items) => new Set(items.map((item) => item.id)).size === items.length);
export const serviceImageSchema = z.object({
  id: z.string().min(1).max(100),
  url: z.string().max(2000).refine((value) => {
    if (/^\/api\/media\/[a-zA-Z0-9-]+$/.test(value)) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }, "Usa una imagen HTTPS o una imagen subida"),
  description: z.string().max(500),
  actions: serviceActionsSchema.optional(),
});
export const serviceImagesSchema = z.array(serviceImageSchema).max(12).refine((items) => new Set(items.map((item) => item.id)).size === items.length);
export type ServiceImage = z.infer<typeof serviceImageSchema>;
export type ServiceAction = z.infer<typeof serviceActionSchema>;

export function primaryInformationType(type: string, url: string) {
  if (url.startsWith("tel:")) return "PHONE";
  if (url.startsWith("mailto:")) return "EMAIL";
  if (["INSTAGRAM", "FACEBOOK"].includes(type)) return "SOCIAL";
  return type;
}
