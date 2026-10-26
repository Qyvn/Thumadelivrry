-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN "peakWindowsJson" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MerchantApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "categoryCodes" TEXT NOT NULL,
    "ownerName" TEXT,
    "whatsappPhone" TEXT,
    "pricingCategory" TEXT NOT NULL DEFAULT 'FOOD',
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "latitude" REAL,
    "longitude" REAL,
    "hoursJson" TEXT,
    "logoDataUrl" TEXT,
    "passwordHash" TEXT,
    "addressLine1" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNotes" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MerchantApplication" ("addressLine1", "businessName", "categoryCodes", "city", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "notes", "reviewNotes", "status", "suburb", "updatedAt") SELECT "addressLine1", "businessName", "categoryCodes", "city", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "notes", "reviewNotes", "status", "suburb", "updatedAt" FROM "MerchantApplication";
DROP TABLE "MerchantApplication";
ALTER TABLE "new_MerchantApplication" RENAME TO "MerchantApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
