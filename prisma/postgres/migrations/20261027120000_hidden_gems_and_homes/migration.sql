-- CreateTable
CREATE TABLE "HiddenGem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Durban',
    "addressHint" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "imageUrl" TEXT,
    "submitterName" TEXT NOT NULL,
    "submitterPhone" TEXT,
    "submitterEmail" TEXT,
    "tipNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNotes" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HomeListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Durban',
    "addressHint" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "beds" INTEGER,
    "maxGuests" INTEGER,
    "nightlyPriceCents" INTEGER,
    "monthlyPriceCents" INTEGER,
    "minNights" INTEGER,
    "checkInFrom" TEXT,
    "checkOutBy" TEXT,
    "amenitiesJson" TEXT,
    "photosJson" TEXT,
    "hostName" TEXT NOT NULL,
    "hostPhone" TEXT NOT NULL,
    "hostEmail" TEXT,
    "hostBio" TEXT,
    "hostPhotoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNotes" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HiddenGem_slug_key" ON "HiddenGem"("slug");

-- CreateIndex
CREATE INDEX "HiddenGem_status_category_idx" ON "HiddenGem"("status", "category");

-- CreateIndex
CREATE INDEX "HiddenGem_area_idx" ON "HiddenGem"("area");

-- CreateIndex
CREATE UNIQUE INDEX "HomeListing_slug_key" ON "HomeListing"("slug");

-- CreateIndex
CREATE INDEX "HomeListing_status_listingType_idx" ON "HomeListing"("status", "listingType");

-- CreateIndex
CREATE INDEX "HomeListing_area_idx" ON "HomeListing"("area");

-- CreateIndex
CREATE INDEX "HomeListing_bedrooms_idx" ON "HomeListing"("bedrooms");

-- CreateIndex
CREATE INDEX "HomeListing_monthlyPriceCents_idx" ON "HomeListing"("monthlyPriceCents");

-- CreateIndex
CREATE INDEX "HomeListing_nightlyPriceCents_idx" ON "HomeListing"("nightlyPriceCents");
