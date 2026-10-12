ALTER TABLE "Promotion"
 ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'PROMOTION',
 ADD COLUMN "terms" TEXT NOT NULL DEFAULT '',
 ADD COLUMN "entryEnabled" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "awardMode" TEXT NOT NULL DEFAULT 'MANUAL',
 ADD COLUMN "winnerLimit" INTEGER NOT NULL DEFAULT 1,
 ADD COLUMN "entryLimit" INTEGER NOT NULL DEFAULT 1000,
 ADD COLUMN "serviceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 ADD COLUMN "redemptionEndsAt" TIMESTAMP(3),
 ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE TABLE "CustomerContact" (
 "id" TEXT PRIMARY KEY, "businessId" TEXT NOT NULL, "name" TEXT NOT NULL,
 "email" TEXT NOT NULL, "phone" TEXT NOT NULL,
 "emailMarketingConsent" BOOLEAN NOT NULL DEFAULT false,
 "smsMarketingConsent" BOOLEAN NOT NULL DEFAULT false,
 "consentUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CustomerContact_businessId_email_key" ON "CustomerContact"("businessId", "email");
CREATE TABLE "RewardEntry" (
 "id" TEXT PRIMARY KEY, "promotionId" TEXT NOT NULL, "contactId" TEXT NOT NULL,
 "publicToken" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
 "redemptionCode" TEXT NOT NULL, "termsSnapshot" TEXT NOT NULL, "serviceIds" TEXT[] NOT NULL,
 "emailNoticeConsent" BOOLEAN NOT NULL DEFAULT false, "smsNoticeConsent" BOOLEAN NOT NULL DEFAULT false,
 "consentVersion" TEXT NOT NULL DEFAULT 'rewards-v1',
 "emailNoticeState" TEXT NOT NULL DEFAULT 'PENDING', "smsNoticeState" TEXT NOT NULL DEFAULT 'PENDING',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "awardedAt" TIMESTAMP(3), "redeemedAt" TIMESTAMP(3), "redeemedServiceId" TEXT,
 FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 FOREIGN KEY ("contactId") REFERENCES "CustomerContact"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RewardEntry_publicToken_key" ON "RewardEntry"("publicToken");
CREATE UNIQUE INDEX "RewardEntry_redemptionCode_key" ON "RewardEntry"("redemptionCode");
CREATE UNIQUE INDEX "RewardEntry_promotionId_contactId_key" ON "RewardEntry"("promotionId", "contactId");
CREATE INDEX "RewardEntry_promotionId_status_idx" ON "RewardEntry"("promotionId", "status");
