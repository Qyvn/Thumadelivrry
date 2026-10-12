/**
 * THUMA development seed.
 * All merchants, products, and couriers created here are DEVELOPMENT SAMPLE data.
 * They must never be presented as confirmed live partners or inventory.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  Role,
  MerchantStatus,
  CourierStatus,
  ServiceCategoryCode,
  InventoryOwner,
} from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding THUMA development data (Cornubia Flats)...");

  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.courierEarning.deleteMany();
  await prisma.merchantCommission.deleteMany();
  await prisma.deliveryEvent.deleteMany();
  await prisma.deliveryAssignment.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.basketItem.deleteMany();
  await prisma.basket.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.merchantStaff.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.merchantApplication.deleteMany();
  await prisma.zoneService.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.courierProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.platformSettings.deleteMany();

  const passwordHash = await bcrypt.hash("thuma-demo-2026", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@thuma.local",
      passwordHash,
      fullName: "THUMA Admin",
      phone: "+27000000001",
      role: Role.ADMIN,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: "customer@thuma.local",
      passwordHash,
      fullName: "Sipho Ndlovu",
      phone: "+27000000002",
      role: Role.CUSTOMER,
      customerProfile: { create: {} },
    },
    include: { customerProfile: true },
  });

  const merchantUser = await prisma.user.create({
    data: {
      email: "merchant@thuma.local",
      passwordHash,
      fullName: "Lerato Dlamini",
      phone: "+27000000003",
      role: Role.MERCHANT_STAFF,
    },
  });

  const courierUser = await prisma.user.create({
    data: {
      email: "courier@thuma.local",
      passwordHash,
      fullName: "Thabo Mokoena",
      phone: "+27000000004",
      role: Role.COURIER,
      courierProfile: {
        create: {
          status: CourierStatus.APPROVED,
          vehicleType: "Motorbike",
          isAvailable: true,
          isDevSample: true,
        },
      },
    },
  });

  const zone = await prisma.deliveryZone.create({
    data: {
      name: "Cornubia Flats",
      slug: "cornubia-flats",
      description:
        "Initial THUMA launch zone. Delivery availability is configurable and must be confirmed before go-live.",
      isActive: true,
      baseFeeCents: 2500,
      boundaryJson: JSON.stringify({
        type: "radius",
        center: { lat: -29.7005, lng: 31.0685 },
        radiusKm: 3,
        note: "Placeholder boundary for development — replace with admin-configured polygon before launch",
      }),
      hoursJson: JSON.stringify({
        mon: { open: "08:00", close: "21:00" },
        tue: { open: "08:00", close: "21:00" },
        wed: { open: "08:00", close: "21:00" },
        thu: { open: "08:00", close: "21:00" },
        fri: { open: "08:00", close: "22:00" },
        sat: { open: "09:00", close: "22:00" },
        sun: { open: "09:00", close: "20:00" },
      }),
    },
  });

  const eats = await prisma.serviceCategory.create({
    data: {
      code: ServiceCategoryCode.EATS,
      name: "THUMA Eats",
      description: "Food from participating restaurants and takeaways",
      sortOrder: 1,
    },
  });
  const market = await prisma.serviceCategory.create({
    data: {
      code: ServiceCategoryCode.MARKET,
      name: "THUMA Market",
      description: "Groceries and everyday essentials",
      sortOrder: 2,
    },
  });
  await prisma.serviceCategory.create({
    data: {
      code: ServiceCategoryCode.LOCAL,
      name: "THUMA Local",
      description: "Neighbourhood marketplace — future",
      isEnabled: false,
      sortOrder: 3,
    },
  });
  await prisma.serviceCategory.create({
    data: {
      code: ServiceCategoryCode.EXPRESS,
      name: "THUMA Express",
      description: "Parcels and errands — future",
      isEnabled: false,
      sortOrder: 4,
    },
  });

  await prisma.zoneService.createMany({
    data: [
      { zoneId: zone.id, categoryId: eats.id, isEnabled: true },
      { zoneId: zone.id, categoryId: market.id, isEnabled: true },
    ],
  });

  await prisma.platformSettings.create({
    data: {
      id: "default",
      serviceFeeCents: 500,
      defaultDeliveryFeeCents: 2500,
      defaultCommissionBps: 1500,
      courierFlatFeeCents: 2000,
      paymentProvider: "mock_payfast",
      launchZoneSlug: "cornubia-flats",
      cancellationPolicyJson: JSON.stringify({
        freeCancelUntil: "MERCHANT_ACCEPTED",
        note: "Configurable policy — not final commercial terms",
      }),
    },
  });

  await prisma.address.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      label: "Home",
      line1: "Block A, Cornubia Flats",
      suburb: "Cornubia",
      city: "Umhlanga",
      province: "KwaZulu-Natal",
      postalCode: "4339",
      latitude: -29.7005,
      longitude: 31.0685,
      isDefault: true,
      inServiceArea: true,
      notes: "Development sample address inside launch zone",
    },
  });

  const eatsApp = await prisma.merchantApplication.create({
    data: {
      businessName: "[DEV] Mama's Kitchen Cornubia",
      contactName: "Lerato Dlamini",
      contactEmail: "merchant@thuma.local",
      contactPhone: "+27000000003",
      categoryCodes: "EATS",
      addressLine1: "Near Cornubia Boulevard",
      suburb: "Cornubia",
      city: "Umhlanga",
      notes: "DEVELOPMENT SAMPLE — not a real participating merchant",
      status: MerchantStatus.APPROVED,
    },
  });

  const marketApp = await prisma.merchantApplication.create({
    data: {
      businessName: "[DEV] Flats Fresh Mart",
      contactName: "Nomsa Khumalo",
      contactEmail: "market@thuma.local",
      contactPhone: "+27000000005",
      categoryCodes: "MARKET",
      addressLine1: "Cornubia retail strip (sample)",
      suburb: "Cornubia",
      city: "Umhlanga",
      notes: "DEVELOPMENT SAMPLE — not a real participating merchant",
      status: MerchantStatus.APPROVED,
    },
  });

  const eatsMerchant = await prisma.merchant.create({
    data: {
      applicationId: eatsApp.id,
      name: "[DEV] Mama's Kitchen Cornubia",
      slug: "dev-mamas-kitchen",
      description:
        "Development sample restaurant for THUMA Eats. Not a confirmed live partner.",
      imageUrl: "/images/dev-eats.svg",
      phone: "+27000000003",
      email: "merchant@thuma.local",
      status: MerchantStatus.APPROVED,
      isDevSample: true,
      addressLine1: "Near Cornubia Boulevard",
      suburb: "Cornubia",
      city: "Umhlanga",
      zoneId: zone.id,
      commissionBps: 1500,
      hoursJson: JSON.stringify({
        mon: { open: "10:00", close: "21:00" },
        tue: { open: "10:00", close: "21:00" },
        wed: { open: "10:00", close: "21:00" },
        thu: { open: "10:00", close: "21:00" },
        fri: { open: "10:00", close: "22:00" },
        sat: { open: "10:00", close: "22:00" },
        sun: { open: "11:00", close: "20:00" },
      }),
      staff: {
        create: { userId: merchantUser.id, isOwner: true },
      },
    },
  });

  const marketMerchant = await prisma.merchant.create({
    data: {
      applicationId: marketApp.id,
      name: "[DEV] Flats Fresh Mart",
      slug: "dev-flats-fresh-mart",
      description:
        "Development sample convenience shop for THUMA Market. Stock is sample data only.",
      imageUrl: "/images/dev-market.svg",
      status: MerchantStatus.APPROVED,
      isDevSample: true,
      addressLine1: "Cornubia retail strip (sample)",
      suburb: "Cornubia",
      city: "Umhlanga",
      zoneId: zone.id,
      commissionBps: 1200,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        merchantId: eatsMerchant.id,
        categoryId: eats.id,
        name: "Bunny Chow (Chicken)",
        slug: "bunny-chow-chicken",
        description: "Sample menu item — quarter loaf with chicken curry.",
        imageUrl: "/images/dev-bunny.svg",
        priceCents: 7500,
        isAvailable: true,
        inventoryOwner: InventoryOwner.MERCHANT,
        isDevSample: true,
        allowsNotes: true,
        sortOrder: 1,
      },
      {
        merchantId: eatsMerchant.id,
        categoryId: eats.id,
        name: "Pap & Grilled Chicken",
        slug: "pap-grilled-chicken",
        description: "Sample plate with pap, grilled chicken, and chakalaka.",
        imageUrl: "/images/dev-pap.svg",
        priceCents: 8900,
        isAvailable: true,
        inventoryOwner: InventoryOwner.MERCHANT,
        isDevSample: true,
        allowsNotes: true,
        sortOrder: 2,
      },
      {
        merchantId: eatsMerchant.id,
        categoryId: eats.id,
        name: "Vetkoek Combo",
        slug: "vetkoek-combo",
        description: "Sample combo — two vetkoek with mince filling.",
        imageUrl: "/images/dev-vetkoek.svg",
        priceCents: 5500,
        isAvailable: true,
        inventoryOwner: InventoryOwner.MERCHANT,
        isDevSample: true,
        allowsNotes: true,
        sortOrder: 3,
      },
      {
        merchantId: marketMerchant.id,
        categoryId: market.id,
        name: "Fresh Milk 2L",
        slug: "fresh-milk-2l",
        description: "Sample dairy product. Merchant-owned stock.",
        imageUrl: "/images/dev-milk.svg",
        priceCents: 3299,
        isAvailable: true,
        inventoryOwner: InventoryOwner.MERCHANT,
        stockQty: 24,
        isDevSample: true,
        allowsNotes: false,
        sortOrder: 1,
      },
      {
        merchantId: marketMerchant.id,
        categoryId: market.id,
        name: "White Bread Loaf",
        slug: "white-bread-loaf",
        description: "Sample bakery item.",
        imageUrl: "/images/dev-bread.svg",
        priceCents: 1899,
        isAvailable: true,
        inventoryOwner: InventoryOwner.MERCHANT,
        stockQty: 40,
        isDevSample: true,
        allowsNotes: false,
        sortOrder: 2,
      },
      {
        merchantId: marketMerchant.id,
        categoryId: market.id,
        name: "Bottled Water 6-Pack",
        slug: "bottled-water-6pack",
        description: "Sample drinks category item.",
        imageUrl: "/images/dev-water.svg",
        priceCents: 4999,
        isAvailable: true,
        inventoryOwner: InventoryOwner.MERCHANT,
        stockQty: 18,
        isDevSample: true,
        allowsNotes: false,
        sortOrder: 3,
      },
      {
        merchantId: marketMerchant.id,
        categoryId: market.id,
        name: "Dishwashing Liquid 750ml",
        slug: "dishwashing-liquid",
        description: "Sample household essential.",
        imageUrl: "/images/dev-household.svg",
        priceCents: 4299,
        isAvailable: true,
        inventoryOwner: InventoryOwner.MERCHANT,
        stockQty: 12,
        isDevSample: true,
        allowsNotes: false,
        sortOrder: 4,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password: thuma-demo-2026):");
  console.log(`  admin@thuma.local     (${admin.role})`);
  console.log(`  customer@thuma.local  (${customerUser.role})`);
  console.log(`  merchant@thuma.local  (${merchantUser.role})`);
  console.log(`  courier@thuma.local   (${courierUser.role})`);
  console.log("All merchants/products are DEVELOPMENT SAMPLE data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
