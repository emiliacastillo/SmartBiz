CREATE TABLE "SmartTagLink" (
    "smartTagId" TEXT NOT NULL,
    "businessLinkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartTagLink_pkey" PRIMARY KEY ("smartTagId", "businessLinkId")
);

CREATE INDEX "SmartTagLink_businessLinkId_idx" ON "SmartTagLink"("businessLinkId");

ALTER TABLE "SmartTagLink"
ADD CONSTRAINT "SmartTagLink_smartTagId_fkey"
FOREIGN KEY ("smartTagId") REFERENCES "SmartTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SmartTagLink"
ADD CONSTRAINT "SmartTagLink_businessLinkId_fkey"
FOREIGN KEY ("businessLinkId") REFERENCES "BusinessLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SmartTagLink" ("smartTagId", "businessLinkId")
SELECT tag."id", link."id"
FROM "SmartTag" tag
JOIN "BusinessLink" link ON link."businessId" = tag."businessId"
WHERE tag."active" = true AND link."active" = true
ON CONFLICT DO NOTHING;
