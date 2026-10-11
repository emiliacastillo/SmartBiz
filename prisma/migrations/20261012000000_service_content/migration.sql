ALTER TYPE "EventType" ADD VALUE 'SERVICE_VIEW';
ALTER TYPE "EventType" ADD VALUE 'IMAGE_VIEW';
ALTER TYPE "EventType" ADD VALUE 'IMAGE_EXPAND';
ALTER TABLE "BusinessLink"
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "images" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "actions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Interaction"
  ADD COLUMN "informationType" TEXT,
  ADD COLUMN "targetId" TEXT;
CREATE INDEX "Interaction_businessId_businessLinkId_createdAt_idx"
  ON "Interaction"("businessId", "businessLinkId", "createdAt");
CREATE TABLE "UploadedImage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "content" BYTEA NOT NULL,
  "contentType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadedImage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "UploadedImage_businessId_idx" ON "UploadedImage"("businessId");
