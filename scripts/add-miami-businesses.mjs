// Additive, idempotent content import. Never runs the legacy seed or updates an existing business.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const database = new URL(process.env.DATABASE_URL);
if (database.searchParams.get("sslmode") === "require") database.searchParams.set("sslmode", "verify-full");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.toString() }) });
const action = (type, label, url) => ({ id: randomUUID(), type, label, url });
const photo = (url, description, source) => ({ url, description, source });
const tools = photo("https://images.unsplash.com/reserve/oIpwxeeSPy1cnwYpqJ1w_Dufer%20Collateral%20test.jpg?w=1000&q=80&fm=jpg", "Workshop tools — illustrative photo by Todd Quackenbush / Unsplash.", "https://unsplash.com/photos/IClZBVw5W5A");
const workshop = photo("https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=1000&q=80&fm=jpg", "Workshop — illustrative photo by Barn Images / Unsplash.", "https://unsplash.com/photos/t5YUoHW6zRo");
const equipment = photo("https://images.unsplash.com/photo-1645651964715-d200ce0939cc?w=1000&q=80&fm=jpg", "Handyman equipment — illustrative photo by Benjamin Lehman / Unsplash.", "https://unsplash.com/photos/EJU7A__krX0");
const repairs = photo("https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=1000&q=80&fm=jpg", "Repair tools — illustrative photo by Julie Molliver / Unsplash.", "https://unsplash.com/photos/Z3vFp7szCAY");
const home1 = "https://www.zillow.com/homedetails/3300-SW-87th-Ct-Miami-FL-33165/44193634_zpid/";
const home2 = "https://www.zillow.com/homedetails/6000-SW-94th-Pl-Miami-FL-33173/44210459_zpid/";
const housePhotos = (hashes, source, address) => hashes.map((hash) => photo(`https://photos.zillowstatic.com/fp/${hash}-cc_ft_1536.jpg`, `${address} — listing photo via Zillow. See the original listing for credits and current details.`, source));
const listings = [
  { label: "Westchester home · $699,900", url: home1,
    description: "3300 SW 87th Ct, Miami, FL 33165\n4 bedrooms · 3 bathrooms · 1,983 sq ft\nSingle-family residence · Built 1968 · 5,250 sq ft lot\nMLS A12104046 · No HOA reported\nSource: Zillow, checked October 11, 2026. Price and availability may change. Title/ownership status: not independently verified; request a title report before purchase. This is an independent listing reference; this sample business does not represent the seller.",
    photos: housePhotos(["eb12a394caf50a29dcf682f31a220adf", "5c94e131ccacad06f90968c14fb66105"], home1, "3300 SW 87th Ct") },
  { label: "Miami pool home · $1,050,000", url: home2,
    description: "6000 SW 94th Pl, Miami, FL 33173\n3 bedrooms · 2 bathrooms · 1,818 sq ft\nSingle-family residence · Built 1962 · 8,611 sq ft lot\nMLS A12094347 · Pool · No HOA reported\nSource: Zillow, checked October 11, 2026. Price and availability may change. Title/ownership status: not independently verified; request a title report before purchase. This is an independent listing reference; this sample business does not represent the seller.",
    photos: housePhotos(["e226b0ccee02b09eb38d9d41c5759842", "cd3016436c1763414c1e02ae943475ff"], home2, "6000 SW 94th Pl") },
];
const definitions = [
  { name: "Miami Fix & Care — Sample", slug: "miami-fix-and-care", tag: "MIAFIX", phone: "+13055550101", email: "miami.handyman@example.com", color: "#164e63", accent: "#ea580c",
    description: "A sample Miami handyman profile: furniture assembly, wall repairs, mounting and seasonal home maintenance. Services and contact details are illustrative; no real appointments are offered through this sample profile.",
    services: [
      { label: "Furniture assembly", description: "Sample service: assembly of flat-pack desks, chairs, shelving and storage units. Includes hardware check, leveling and packaging cleanup. Share the product link and room access details for a tailored estimate.", photos: [workshop, tools] },
      { label: "Drywall repair & paint touch-ups", description: "Sample service: patch small wall holes, prepare surfaces and touch up interior paint. Send photos of the affected area, approximate dimensions and paint color. Larger structural or specialist work requires a qualified contractor.", photos: [repairs, equipment] },
      { label: "TV, shelf & picture mounting", description: "Sample service: mounting on suitable interior walls, shelf alignment and picture arrangements. Provide wall type, item dimensions, approximate weight and mounting hardware details before scheduling.", photos: [equipment, tools] },
      { label: "Home maintenance visit", description: "Sample service: door and cabinet adjustments, weatherstripping, caulk touch-ups and a small-repairs checklist. Serving the Miami area. The sample contact below is a placeholder for the business owner to replace.", photos: [tools, repairs] },
    ],
    draftTitle: "Furniture assembly reward", draftDescription: "Draft example: one furniture assembly visit for a selected participant.",
  },
  { name: "Biscayne Home Guide — Sample", slug: "biscayne-home-guide", tag: "MIAHOME", phone: "+13055550102", email: "miami.homes@example.com", color: "#172554", accent: "#0d9488",
    description: "Sample Miami real-estate business profile with buyer and seller services. Property cards link to independent Zillow listings; this sample business does not represent their owners. Contacts and the illustrative rating are fictional, not verified client outcomes.",
    services: [
      ...listings,
      { label: "Buyer consultation & home tours", description: "Sample service: define your preferred Miami neighborhoods, budget, home features and showing availability. Compare listings and prepare questions about maintenance, insurance, flood zones and recurring ownership costs.", photos: [], url: "https://www.zillow.com/miami-fl/" },
      { label: "Seller preparation & listing plan", description: "Sample service: a property walkthrough, photography checklist, showing plan and discussion of comparable listings. Service scope and pricing would be agreed with a real licensed professional before engagement.", photos: [] },
      { label: "Title & closing checklist", description: "Sample service: coordinate questions for your chosen title company and closing professionals. Checklist: title search, liens, survey, inspection, HOA documents where relevant and closing schedule. No property title has been verified by this sample profile.", photos: [] },
      { label: "Client experience · illustrative 4.8 / 5", description: "SAMPLE RATING — NOT REAL CUSTOMER REVIEWS\n4.8 / 5 is an illustrative satisfaction score to demonstrate this profile. Verified clients: 0. No success rate or certainty of a purchase is claimed. Replace this content with documented feedback and your actual review profile. Browse independent Miami agent reviews on Zillow using the link below.", url: "https://www.zillow.com/miami-fl/real-estate-agent-reviews/", photos: [] },
    ],
    draftTitle: "Buyer consultation event", draftDescription: "Draft example: a Miami home-buying information session with a consultation reward.",
  },
];
try {
  for (const definition of definitions) {
    if (await prisma.business.findUnique({ where: { slug: definition.slug } })) { console.log(`Skipped existing business: ${definition.slug}`); continue; }
    const assets = new Map();
    for (const image of definition.services.flatMap((s) => s.photos)) {
      if (assets.has(image.url)) continue;
      const response = await fetch(image.url, { signal: AbortSignal.timeout(30000) });
      const contentType = response.headers.get("content-type")?.split(";")[0];
      if (!response.ok || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) throw new Error(`Image unavailable: ${image.source}`);
      const content = Buffer.from(await response.arrayBuffer());
      if (content.length > 2 * 1024 * 1024) throw new Error("Source image exceeds 2 MB");
      assets.set(image.url, { content, contentType });
    }
    const result = await prisma.$transaction(async (tx) => {
      // Concurrent invocations serialize before checking whether this exact sample already exists.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(718234921)`;
      if (await tx.business.findUnique({ where: { slug: definition.slug } })) return null;
      const business = await tx.business.create({ data: { name: definition.name, slug: definition.slug, description: definition.description, phone: definition.phone, address: "Miami, Florida — sample service area", primaryColor: definition.color, secondaryColor: definition.accent, active: true } });
      const mediaIds = new Map();
      for (const [url, data] of assets) { const image = await tx.uploadedImage.create({ data: { ...data, businessId: business.id } }); mediaIds.set(url, image.id); }
      const ids = [];
      for (const [position, service] of definition.services.entries()) {
        const link = await tx.businessLink.create({ data: { businessId: business.id, type: "CUSTOM", label: service.label, url: service.url ?? "", description: service.description, position,
          actions: [action("PHONE", "Call sample contact", `tel:${definition.phone}`), action("EMAIL", "Email sample contact", `mailto:${definition.email}`)],
          images: service.photos.map((image) => ({ id: randomUUID(), url: `/api/media/${mediaIds.get(image.url)}`, description: image.description, actions: [action("LINK", service.url?.includes("zillow.com/homedetails") ? "View this home on Zillow" : "Photo source", image.source), action("EMAIL", "Ask about this image", `mailto:${definition.email}`)] })),
        } }); ids.push(link.id);
      }
      const tag = await tx.smartTag.create({ data: { businessId: business.id, code: definition.tag, name: "Miami smart page", location: "Miami, Florida", linkAssignments: { create: ids.map((businessLinkId) => ({ businessLinkId })) } } });
      await tx.promotion.create({ data: { businessId: business.id, title: definition.draftTitle, description: definition.draftDescription, kind: definition.tag === "MIAFIX" ? "REWARD" : "EVENT", active: false, entryEnabled: true, terms: "Unpublished sample campaign. The business administrator must replace these terms, confirm the reward and configure dates and notification senders before activation. No real prize is offered by this draft.", serviceIds: [ids[definition.tag === "MIAFIX" ? 0 : 2]], winnerLimit: 1, entryLimit: 100 } });
      return { name: business.name, tag: tag.code, services: ids.length };
    }, { timeout: 30000 });
    if (result) console.log(JSON.stringify(result));
  }
} finally { await prisma.$disconnect(); }
