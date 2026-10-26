-- AlterTable
ALTER TABLE "MerchantApplication" ADD COLUMN     "hoursJson" TEXT,
ADD COLUMN     "isIndependent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "logoDataUrl" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "ownerName" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "pricingCategory" TEXT NOT NULL DEFAULT 'FOOD',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "whatsappPhone" TEXT;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "peakWindowsJson" TEXT;
