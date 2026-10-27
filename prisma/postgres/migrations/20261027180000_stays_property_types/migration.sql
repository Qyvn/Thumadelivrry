-- AlterTable: stay property types + hotel fields
ALTER TABLE "HomeListing" ADD COLUMN "hotelRoomTypesNote" TEXT;
ALTER TABLE "HomeListing" ADD COLUMN "websiteUrl" TEXT;

-- Remap legacy propertyType values sensibly
UPDATE "HomeListing"
SET "propertyType" = 'MONTHLY_RENTAL'
WHERE "listingType" = 'LONG_TERM';

UPDATE "HomeListing"
SET "propertyType" = 'GUESTHOUSE'
WHERE "listingType" = 'SHORT_STAY' AND "propertyType" = 'ROOM';

UPDATE "HomeListing"
SET "propertyType" = 'HOLIDAY_HOME'
WHERE "listingType" = 'SHORT_STAY'
  AND "propertyType" IN ('APARTMENT', 'HOUSE', 'STUDIO', 'COTTAGE', 'OTHER');

-- Any remaining legacy codes → HOLIDAY_HOME
UPDATE "HomeListing"
SET "propertyType" = 'HOLIDAY_HOME'
WHERE "propertyType" NOT IN ('HOTEL', 'GUESTHOUSE', 'BNB', 'HOLIDAY_HOME', 'MONTHLY_RENTAL');

CREATE INDEX "HomeListing_status_propertyType_idx" ON "HomeListing"("status", "propertyType");
