const { PrismaClient, MemberRole, LinkType } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/smartbiz?schema=public";
  const connectionUrl = new URL(connectionString);

  if (connectionUrl.searchParams.get("sslmode") === "require") {
    connectionUrl.searchParams.set("sslmode", "verify-full");
  }

  return connectionUrl.toString();
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getConnectionString(),
  }),
});

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@smartbiz.local";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Platform Admin" },
    create: {
      email: adminEmail,
      name: "Platform Admin",
    },
  });

  const businessSeeds = [
    {
      legacySlug: "sunset-bistro",
      name: "Columbia Restaurant - Ybor City",
      slug: "columbia-restaurant-ybor-city",
      description: "The original Columbia Restaurant in Tampa's historic Ybor City, serving Spanish and Cuban cuisine.",
      logoUrl: null,
      primaryColor: "#8b1e24",
      secondaryColor: "#d4a64a",
      phone: "+1 (813) 248-4961",
      address: "2117 E. 7th Ave., Tampa, FL 33605",
      website: "https://www.columbiarestaurant.com/ybor-city-tampa",
      active: true,
    },
    {
      legacySlug: "luna-nail-studio",
      name: "Ulele",
      slug: "ulele-tampa",
      description: "Tampa restaurant serving native-inspired food and spirits made with ingredients from Florida waters and land.",
      logoUrl: null,
      primaryColor: "#286c68",
      secondaryColor: "#d39b4a",
      phone: "+1 (813) 999-4952",
      address: "1810 N. Highland Ave., Tampa, FL 33602",
      website: "https://ulele.com/",
      active: true,
    },
    {
      legacySlug: "forge-and-fade",
      name: "The Ravenous Pig",
      slug: "the-ravenous-pig-winter-park",
      description: "A Winter Park restaurant featuring seasonal American cuisine and a menu that changes daily.",
      logoUrl: null,
      primaryColor: "#41433c",
      secondaryColor: "#c8663a",
      phone: "+1 (407) 628-2333",
      address: "565 W. Fairbanks Ave., Winter Park, FL 32789",
      website: "https://www.theravenouspig.com/",
      active: true,
    },
    {
      name: "Tampa Nails",
      slug: "tampa-nails-westshore",
      description: "Nail salon in Tampa's Westshore area offering manicures, pedicures, and other beauty services.",
      logoUrl: null,
      primaryColor: "#b85375",
      secondaryColor: "#e5ae87",
      phone: "+1 (813) 513-8600",
      address: "4734 W Cypress St, Tampa, FL 33607",
      website: "https://tampanails.com/",
      active: true,
    },
    {
      name: "Tampa Spa & Nails",
      slug: "tampa-spa-and-nails",
      description: "Tampa nail salon offering manicures, pedicures, nail art, and waxing services.",
      logoUrl: null,
      primaryColor: "#c16a79",
      secondaryColor: "#e4b983",
      phone: "+1 (813) 497-8900",
      address: "3018 W Kennedy Blvd, Tampa, FL 33609",
      website: "https://tampaspanails.com/",
      active: true,
    },
    {
      name: "Barber & Co. - Gasworx",
      slug: "barber-and-co-gasworx",
      description: "Tampa barbershop at Gold's Gym Gasworx offering haircuts, beard trims, shaves, and grooming packages.",
      logoUrl: null,
      primaryColor: "#343d42",
      secondaryColor: "#c59a55",
      phone: "+1 (813) 625-4762",
      address: "802 N 12th Street, Tampa, FL 33602",
      website: "https://www.barbercotampa.com/",
      active: true,
    },
  ];

  const businessesBySlug = new Map();

  for (const business of businessSeeds) {
    const { legacySlug, ...businessData } = business;
    const legacyBusiness = legacySlug
      ? await prisma.business.findUnique({ where: { slug: legacySlug } })
      : null;
    const created = legacyBusiness
      ? await prisma.business.update({ where: { id: legacyBusiness.id }, data: businessData })
      : await prisma.business.upsert({
          where: { slug: businessData.slug },
          update: businessData,
          create: businessData,
        });

    businessesBySlug.set(business.slug, created);

    await prisma.businessMembership.upsert({
      where: {
        userId_businessId: {
          userId: adminUser.id,
          businessId: created.id,
        },
      },
      update: { role: MemberRole.OWNER },
      create: {
        userId: adminUser.id,
        businessId: created.id,
        role: MemberRole.OWNER,
      },
    });
  }

  const tagSeeds = [
    {
      businessSlug: "columbia-restaurant-ybor-city",
      code: "A7K92",
      name: "Columbia Ybor City",
      location: "Tampa, Florida",
      active: true,
    },
    {
      businessSlug: "ulele-tampa",
      code: "N8L21",
      name: "Ulele Tampa",
      location: "Tampa, Florida",
      active: true,
    },
    {
      businessSlug: "the-ravenous-pig-winter-park",
      code: "R2Q09",
      name: "The Ravenous Pig",
      location: "Winter Park, Florida",
      active: true,
    },
    {
      businessSlug: "tampa-nails-westshore",
      code: "TN6A82",
      name: "Tampa Nails - Westshore",
      location: "Tampa, Florida",
      active: true,
    },
    {
      businessSlug: "tampa-spa-and-nails",
      code: "TS4P91",
      name: "Tampa Spa & Nails",
      location: "Tampa, Florida",
      active: true,
    },
    {
      businessSlug: "barber-and-co-gasworx",
      code: "BC7G53",
      name: "Barber & Co. Gasworx",
      location: "Tampa, Florida",
      active: true,
    },
  ];

  for (const tag of tagSeeds) {
    const business = businessesBySlug.get(tag.businessSlug);
    await prisma.smartTag.upsert({
      where: { code: tag.code },
      update: {
        name: tag.name,
        location: tag.location,
        active: tag.active,
        businessId: business.id,
      },
      create: {
        businessId: business.id,
        code: tag.code,
        name: tag.name,
        location: tag.location,
        active: tag.active,
      },
    });

  }

  const linkSeeds = [
    {
      businessSlug: "columbia-restaurant-ybor-city",
      type: LinkType.MENU,
      label: "Official Dinner Menu",
      url: "https://www.columbiarestaurant.com/_files/ugd/28e529_55b4395ee05445c0acdf7f673686322e.pdf",
      icon: "utensils",
      position: 1,
      active: true,
    },
    {
      businessSlug: "columbia-restaurant-ybor-city",
      type: LinkType.PHONE,
      label: "Call Columbia Ybor City",
      url: "tel:+18132484961",
      icon: "phone",
      position: 2,
      active: true,
    },
    {
      businessSlug: "columbia-restaurant-ybor-city",
      type: LinkType.RESERVATION,
      label: "Make a Reservation",
      url: "https://www.opentable.com/columbia-restaurant-ybor-city-reservations-tampa",
      icon: "calendar",
      position: 3,
      active: true,
    },
    {
      businessSlug: "ulele-tampa",
      type: LinkType.MENU,
      label: "Official Menus",
      url: "https://ulele.com/menus/",
      icon: "utensils",
      position: 1,
      active: true,
    },
    {
      businessSlug: "ulele-tampa",
      type: LinkType.PHONE,
      label: "Call Ulele",
      url: "tel:+18139994952",
      icon: "phone",
      position: 2,
      active: true,
    },
    {
      businessSlug: "ulele-tampa",
      type: LinkType.RESERVATION,
      label: "Make a Reservation",
      url: "https://www.opentable.com/ulele-reservations-tampa",
      icon: "calendar",
      position: 3,
      active: true,
    },
    {
      businessSlug: "the-ravenous-pig-winter-park",
      type: LinkType.MENU,
      label: "Official Menu",
      url: "https://www.theravenouspig.com/menu",
      icon: "utensils",
      position: 1,
      active: true,
    },
    {
      businessSlug: "the-ravenous-pig-winter-park",
      type: LinkType.PHONE,
      label: "Call The Ravenous Pig",
      url: "tel:+14076282333",
      icon: "phone",
      position: 2,
      active: true,
    },
    {
      businessSlug: "the-ravenous-pig-winter-park",
      type: LinkType.WEBSITE,
      label: "Contact The Ravenous Pig",
      url: "https://www.theravenouspig.com/contact",
      icon: "globe",
      position: 3,
      active: true,
    },
    {
      businessSlug: "tampa-nails-westshore",
      type: LinkType.MENU,
      label: "Services Menu",
      url: "https://tampanails.com/services/",
      icon: "sparkles",
      position: 1,
      active: true,
    },
    {
      businessSlug: "tampa-nails-westshore",
      type: LinkType.BOOKING,
      label: "Book an Appointment",
      url: "https://booking.gocheckin.net/v2/13064",
      icon: "calendar",
      position: 2,
      active: true,
    },
    {
      businessSlug: "tampa-nails-westshore",
      type: LinkType.PHONE,
      label: "Call Tampa Nails",
      url: "tel:+18135138600",
      icon: "phone",
      position: 3,
      active: true,
    },
    {
      businessSlug: "tampa-spa-and-nails",
      type: LinkType.MENU,
      label: "Services Menu",
      url: "https://tampaspanails.com/services",
      icon: "sparkles",
      position: 1,
      active: true,
    },
    {
      businessSlug: "tampa-spa-and-nails",
      type: LinkType.BOOKING,
      label: "Book an Appointment",
      url: "https://lk.macmarketing.us/Tampa33609-Booking",
      icon: "calendar",
      position: 2,
      active: true,
    },
    {
      businessSlug: "tampa-spa-and-nails",
      type: LinkType.PHONE,
      label: "Call Tampa Spa & Nails",
      url: "tel:+18134978900",
      icon: "phone",
      position: 3,
      active: true,
    },
    {
      businessSlug: "barber-and-co-gasworx",
      type: LinkType.CUSTOM,
      label: "Services and Pricing",
      url: "https://www.barbercotampa.com/",
      icon: "scissors",
      position: 1,
      active: true,
    },
    {
      businessSlug: "barber-and-co-gasworx",
      type: LinkType.BOOKING,
      label: "Book an Appointment",
      url: "https://www.barbercotampa.com/team",
      icon: "calendar",
      position: 2,
      active: true,
    },
    {
      businessSlug: "barber-and-co-gasworx",
      type: LinkType.PHONE,
      label: "Call Barber & Co.",
      url: "tel:+18136254762",
      icon: "phone",
      position: 3,
      active: true,
    },
  ];

  for (const link of linkSeeds) {
    const business = businessesBySlug.get(link.businessSlug);
    const existing = await prisma.businessLink.findFirst({
      where: {
        businessId: business.id,
        position: link.position,
      },
    });

    if (existing) {
      await prisma.businessLink.update({
        where: { id: existing.id },
        data: {
          label: link.label,
          url: link.url,
          icon: link.icon,
          position: link.position,
          active: link.active,
          type: link.type,
        },
      });
      continue;
    }

    await prisma.businessLink.create({
      data: {
        businessId: business.id,
        type: link.type,
        label: link.label,
        url: link.url,
        icon: link.icon,
        position: link.position,
        active: link.active,
      },
    });
  }

  const activeTags = await prisma.smartTag.findMany({
    where: { businessId: { in: Array.from(businessesBySlug.values(), (business) => business.id) }, active: true },
    select: { id: true, businessId: true },
  });
  const activeLinks = await prisma.businessLink.findMany({
    where: { businessId: { in: Array.from(businessesBySlug.values(), (business) => business.id) }, active: true },
    select: { id: true, businessId: true },
  });
  const tagLinkAssignments = activeTags.flatMap((tag) =>
    activeLinks
      .filter((link) => link.businessId === tag.businessId)
      .map((link) => ({ smartTagId: tag.id, businessLinkId: link.id })),
  );
  if (tagLinkAssignments.length) {
    await prisma.smartTagLink.createMany({ data: tagLinkAssignments, skipDuplicates: true });
  }

  await prisma.promotion.updateMany({
    where: {
      businessId: { in: Array.from(businessesBySlug.values(), (business) => business.id) },
      title: { in: ["Sunset Supper Club", "Signature Soft Gel Set"] },
    },
    data: { active: false },
  });

  console.log("Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
