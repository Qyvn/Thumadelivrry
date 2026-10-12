-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "serviceFeeCents" INTEGER NOT NULL DEFAULT 500,
    "defaultDeliveryFeeCents" INTEGER NOT NULL DEFAULT 2500,
    "minOrderCents" INTEGER NOT NULL DEFAULT 20000,
    "defaultCommissionBps" INTEGER NOT NULL DEFAULT 1500,
    "courierFlatFeeCents" INTEGER NOT NULL DEFAULT 2000,
    "paymentProvider" TEXT NOT NULL DEFAULT 'mock_payfast',
    "launchZoneSlug" TEXT NOT NULL DEFAULT 'cornubia-flats',
    "cancellationPolicyJson" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PlatformSettings" ("cancellationPolicyJson", "courierFlatFeeCents", "defaultCommissionBps", "defaultDeliveryFeeCents", "id", "launchZoneSlug", "paymentProvider", "serviceFeeCents", "updatedAt") SELECT "cancellationPolicyJson", "courierFlatFeeCents", "defaultCommissionBps", "defaultDeliveryFeeCents", "id", "launchZoneSlug", "paymentProvider", "serviceFeeCents", "updatedAt" FROM "PlatformSettings";
DROP TABLE "PlatformSettings";
ALTER TABLE "new_PlatformSettings" RENAME TO "PlatformSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
