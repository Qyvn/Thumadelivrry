-- CreateTable
CREATE TABLE "PlusSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priceCents" INTEGER NOT NULL,
    "billingStatus" TEXT NOT NULL DEFAULT 'NOT_YET_BILLED',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlusSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CourierEarning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courierId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "tipCents" INTEGER NOT NULL DEFAULT 0,
    "breakdownJson" TEXT,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourierEarning_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "CourierProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CourierEarning" ("amountCents", "courierId", "createdAt", "id", "orderId", "settled") SELECT "amountCents", "courierId", "createdAt", "id", "orderId", "settled" FROM "CourierEarning";
DROP TABLE "CourierEarning";
ALTER TABLE "new_CourierEarning" RENAME TO "CourierEarning";
CREATE UNIQUE INDEX "CourierEarning_orderId_key" ON "CourierEarning"("orderId");
CREATE TABLE "new_Merchant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isDevSample" BOOLEAN NOT NULL DEFAULT false,
    "addressLine1" TEXT,
    "suburb" TEXT,
    "city" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "hoursJson" TEXT,
    "commissionBps" INTEGER,
    "pricingCategory" TEXT NOT NULL DEFAULT 'FOOD',
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "introRateStartedAt" DATETIME,
    "zoneId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Merchant_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MerchantApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Merchant_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Merchant" ("addressLine1", "applicationId", "city", "commissionBps", "createdAt", "description", "email", "hoursJson", "id", "imageUrl", "isDevSample", "latitude", "longitude", "name", "phone", "slug", "status", "suburb", "updatedAt", "zoneId") SELECT "addressLine1", "applicationId", "city", "commissionBps", "createdAt", "description", "email", "hoursJson", "id", "imageUrl", "isDevSample", "latitude", "longitude", "name", "phone", "slug", "status", "suburb", "updatedAt", "zoneId" FROM "Merchant";
DROP TABLE "Merchant";
ALTER TABLE "new_Merchant" RENAME TO "Merchant";
CREATE UNIQUE INDEX "Merchant_applicationId_key" ON "Merchant"("applicationId");
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "itemTotalCents" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "serviceFeeCents" INTEGER NOT NULL DEFAULT 0,
    "smallOrderFeeCents" INTEGER NOT NULL DEFAULT 0,
    "peakFeeCents" INTEGER NOT NULL DEFAULT 0,
    "tipCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryDistanceKm" REAL,
    "distanceSource" TEXT,
    "plusApplied" BOOLEAN NOT NULL DEFAULT false,
    "pricingJson" TEXT,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "customerNotes" TEXT,
    "rejectReason" TEXT,
    "cancelReason" TEXT,
    "idempotencyKey" TEXT,
    "placedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "readyAt" DATETIME,
    "deliveredAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("acceptedAt", "addressId", "cancelReason", "cancelledAt", "createdAt", "currency", "customerId", "customerNotes", "deliveredAt", "deliveryFeeCents", "discountCents", "id", "idempotencyKey", "itemTotalCents", "merchantId", "orderNumber", "placedAt", "readyAt", "rejectReason", "serviceFeeCents", "status", "taxCents", "totalCents", "updatedAt", "zoneId") SELECT "acceptedAt", "addressId", "cancelReason", "cancelledAt", "createdAt", "currency", "customerId", "customerNotes", "deliveredAt", "deliveryFeeCents", "discountCents", "id", "idempotencyKey", "itemTotalCents", "merchantId", "orderNumber", "placedAt", "readyAt", "rejectReason", "serviceFeeCents", "status", "taxCents", "totalCents", "updatedAt", "zoneId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE TABLE "new_PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "serviceFeeCents" INTEGER NOT NULL DEFAULT 500,
    "defaultDeliveryFeeCents" INTEGER NOT NULL DEFAULT 2500,
    "minOrderCents" INTEGER NOT NULL DEFAULT 6000,
    "defaultCommissionBps" INTEGER NOT NULL DEFAULT 1500,
    "courierFlatFeeCents" INTEGER NOT NULL DEFAULT 2000,
    "deliveryBand1MaxKm" REAL NOT NULL DEFAULT 3,
    "deliveryBand1Cents" INTEGER NOT NULL DEFAULT 1900,
    "deliveryBand2MaxKm" REAL NOT NULL DEFAULT 6,
    "deliveryBand2Cents" INTEGER NOT NULL DEFAULT 2500,
    "deliveryBand3MaxKm" REAL NOT NULL DEFAULT 10,
    "deliveryBand3Cents" INTEGER NOT NULL DEFAULT 3200,
    "deliveryPerKmBeyondCents" INTEGER NOT NULL DEFAULT 300,
    "deliveryFeeCapCents" INTEGER NOT NULL DEFAULT 4500,
    "fallbackDistanceKm" REAL NOT NULL DEFAULT 5,
    "serviceFeeWaiverOverCents" INTEGER NOT NULL DEFAULT 40000,
    "smallOrderFeeCents" INTEGER NOT NULL DEFAULT 1000,
    "smallOrderUnderCents" INTEGER NOT NULL DEFAULT 10000,
    "minOrderFoodCents" INTEGER NOT NULL DEFAULT 6000,
    "minOrderGroceryCents" INTEGER NOT NULL DEFAULT 10000,
    "peakFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "peakFeeCents" INTEGER NOT NULL DEFAULT 500,
    "commissionRestaurantBps" INTEGER NOT NULL DEFAULT 1500,
    "commissionGroceryBps" INTEGER NOT NULL DEFAULT 800,
    "commissionPickupBps" INTEGER NOT NULL DEFAULT 500,
    "introCommissionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "introCommissionBps" INTEGER NOT NULL DEFAULT 1200,
    "introCommissionMonths" INTEGER NOT NULL DEFAULT 3,
    "courierBaseCents" INTEGER NOT NULL DEFAULT 2500,
    "courierPerKmCents" INTEGER NOT NULL DEFAULT 300,
    "courierBaseCoversKm" REAL NOT NULL DEFAULT 3,
    "courierBatchDropCents" INTEGER NOT NULL DEFAULT 1200,
    "plusEnabled" BOOLEAN NOT NULL DEFAULT true,
    "plusMonthlyPriceCents" INTEGER NOT NULL DEFAULT 5900,
    "plusFreeDeliveryMaxKm" REAL NOT NULL DEFAULT 6,
    "plusFoodMinCents" INTEGER NOT NULL DEFAULT 15000,
    "plusGroceryMinCents" INTEGER NOT NULL DEFAULT 25000,
    "paymentProvider" TEXT NOT NULL DEFAULT 'mock_payfast',
    "launchZoneSlug" TEXT NOT NULL DEFAULT 'cornubia-flats',
    "cancellationPolicyJson" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PlatformSettings" ("cancellationPolicyJson", "courierFlatFeeCents", "defaultCommissionBps", "defaultDeliveryFeeCents", "id", "launchZoneSlug", "minOrderCents", "paymentProvider", "serviceFeeCents", "updatedAt") SELECT "cancellationPolicyJson", "courierFlatFeeCents", "defaultCommissionBps", "defaultDeliveryFeeCents", "id", "launchZoneSlug", "minOrderCents", "paymentProvider", "serviceFeeCents", "updatedAt" FROM "PlatformSettings";
DROP TABLE "PlatformSettings";
ALTER TABLE "new_PlatformSettings" RENAME TO "PlatformSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlusSubscription_customerId_key" ON "PlusSubscription"("customerId");

-- Data: legacy merchant commission (1500/1200 bps) was a schema default, not a negotiated
-- rate. Clear it so merchants use the category defaults from PlatformSettings.
UPDATE "Merchant" SET "commissionBps" = NULL;
-- Legacy single minimum is superseded by per-category minimums.
UPDATE "PlatformSettings" SET "minOrderCents" = 6000;
