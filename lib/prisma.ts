import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaSchema?: string };
// Hot reload can retain a client created before new fields were generated.
const prismaSchema = JSON.stringify(Prisma.dmmf.datamodel);

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/smartbiz?schema=public";
  const connectionUrl = new URL(connectionString);

  if (connectionUrl.searchParams.get("sslmode") === "require") {
    connectionUrl.searchParams.set("sslmode", "verify-full");
  }

  return connectionUrl.toString();
}

export const prisma = (globalForPrisma.prismaSchema === prismaSchema ? globalForPrisma.prisma : undefined) ?? new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getConnectionString(),
  }),
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchema = prismaSchema;
}
