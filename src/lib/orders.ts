import { Prisma } from "@prisma/client";
import {
  DeliveryAssignmentStatus,
  OrderStatus,
  PaymentStatus,
  Role,
} from "@/lib/constants";
import { prisma } from "./db";
import { isAddressInServiceArea } from "./eligibility";
import {
  commissionBps,
  commissionCents,
  courierPay,
  normalisePricingCategory,
  pricingFromSettings,
} from "./pricing";
import { quoteForBasket } from "./pricing-server";
import { distanceKm, parseZoneGeo } from "./geo";
import { assertTransition } from "./order-lifecycle";
import { confirmPaymentFromProvider, createPaymentIntent } from "./payments";
import { writeAudit } from "./audit";
import { getLaunchZone } from "./zones";

function orderNumber(): string {
  const n = Date.now().toString(36).toUpperCase();
  return `THU-${n}`;
}

export async function getOrCreateBasket(customerId: string) {
  const existing = await prisma.basket.findFirst({
    where: { customerId },
    include: {
      items: {
        include: {
          product: { include: { merchant: true, category: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

  return prisma.basket.create({
    data: { customerId },
    include: {
      items: {
        include: {
          product: { include: { merchant: true, category: true } },
        },
      },
    },
  });
}

export async function addToBasket(params: {
  customerId: string;
  productId: string;
  quantity: number;
  notes?: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: { merchant: true },
  });
  if (!product || !product.isActive || !product.isAvailable) {
    throw new Error("Product is not available");
  }
  if (product.merchant.status !== "APPROVED") {
    throw new Error("Merchant is not orderable");
  }

  // Enforce nearest-store radius against the customer's default delivery pin
  const customer = await prisma.customerProfile.findUnique({
    where: { id: params.customerId },
    include: { addresses: { where: { isDefault: true }, take: 1 } },
  });
  const delivery = customer?.addresses[0];
  const zone = product.merchant.zoneId
    ? await prisma.deliveryZone.findUnique({
        where: { id: product.merchant.zoneId },
      })
    : await getLaunchZone();
  if (zone && delivery?.latitude != null && delivery?.longitude != null) {
    const geo = parseZoneGeo(zone.boundaryJson);
    const radiusKm = geo.radiusKm ?? 40;
    if (
      product.merchant.latitude == null ||
      product.merchant.longitude == null
    ) {
      throw new Error(
        "This store has no map location yet and cannot be ordered within the delivery radius.",
      );
    }
    const km = distanceKm(
      { lat: delivery.latitude, lng: delivery.longitude },
      { lat: product.merchant.latitude, lng: product.merchant.longitude },
    );
    if (km > radiusKm) {
      throw new Error(
        `This store is ${km.toFixed(1)} km away — outside the ${radiusKm} km delivery radius from your address.`,
      );
    }
  }

  const basket = await getOrCreateBasket(params.customerId);

  // Single-merchant baskets for Phase 1 simplicity
  const otherMerchant = basket.items.find(
    (i) => i.product.merchantId !== product.merchantId,
  );
  if (otherMerchant) {
    throw new Error(
      "Your basket has items from another shop. Clear it or checkout first.",
    );
  }

  const existing = basket.items.find((i) => i.productId === product.id);
  if (existing) {
    await prisma.basketItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + params.quantity,
        notes: params.notes ?? existing.notes,
        unitPriceCents: product.priceCents,
      },
    });
  } else {
    await prisma.basketItem.create({
      data: {
        basketId: basket.id,
        productId: product.id,
        quantity: params.quantity,
        notes: params.notes,
        unitPriceCents: product.priceCents,
      },
    });
  }

  return getOrCreateBasket(params.customerId);
}

export async function updateBasketItem(
  customerId: string,
  itemId: string,
  quantity: number,
) {
  const basket = await getOrCreateBasket(customerId);
  const item = basket.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found");

  if (quantity <= 0) {
    await prisma.basketItem.delete({ where: { id: itemId } });
  } else {
    await prisma.basketItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }
  return getOrCreateBasket(customerId);
}

export async function clearBasket(customerId: string) {
  const basket = await getOrCreateBasket(customerId);
  await prisma.basketItem.deleteMany({ where: { basketId: basket.id } });
  return getOrCreateBasket(customerId);
}

export function summariseBasket(
  items: { quantity: number; unitPriceCents: number }[],
  deliveryFeeCents: number,
  serviceFeeCents: number,
) {
  const itemTotalCents = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPriceCents,
    0,
  );
  const totalCents = itemTotalCents + deliveryFeeCents + serviceFeeCents;
  return { itemTotalCents, deliveryFeeCents, serviceFeeCents, totalCents };
}

export async function checkoutOrder(params: {
  customerId: string;
  userId: string;
  addressId: string;
  customerNotes?: string;
  idempotencyKey: string;
  /** Optional courier tip in cents (100% to courier) */
  tipCents?: number;
  /** Demo only: simulate successful provider callback after intent creation */
  simulatePaymentSuccess: boolean;
}) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
    include: { payment: true, items: true },
  });
  if (existing) {
    return existing;
  }

  const basket = await getOrCreateBasket(params.customerId);
  if (basket.items.length === 0) {
    throw new Error("Basket is empty");
  }

  const address = await prisma.address.findFirst({
    where: { id: params.addressId, customerId: params.customerId },
  });
  if (!address) throw new Error("Address not found");

  const merchantId = basket.items[0].product.merchantId;
  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: merchantId },
  });
  if (merchant.status !== "APPROVED") {
    throw new Error("Merchant is not available for orders");
  }
  if (!merchant.zoneId) {
    throw new Error("Merchant has no delivery zone configured");
  }

  const zone = await prisma.deliveryZone.findUniqueOrThrow({
    where: { id: merchant.zoneId },
  });
  if (!zone.isActive) {
    throw new Error("Delivery zone is not active");
  }

  const eligible = isAddressInServiceArea(
    {
      line1: address.line1,
      suburb: address.suburb,
      city: address.city,
      building: address.building,
      unitNumber: address.unitNumber,
      latitude: address.latitude,
      longitude: address.longitude,
    },
    zone.boundaryJson,
  );
  if (!eligible) {
    throw new Error(
      "This address is outside the current THUMA delivery area (Greater Durban radius).",
    );
  }

  const itemTotalCents = basket.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPriceCents,
    0,
  );
  const { quote, config } = await quoteForBasket({
    customerId: params.customerId,
    itemTotalCents,
    merchant,
    address,
    zoneBoundaryJson: zone.boundaryJson,
    tipCents: params.tipCents,
  });
  if (!quote.meetsMinimum) {
    throw new Error(
      `Minimum order for this shop is R${(quote.minOrderCents / 100).toFixed(0)}. Add R${(quote.shortfallCents / 100).toFixed(2)} more in items before delivery.`,
    );
  }
  const commission = commissionBps({
    category: normalisePricingCategory(merchant.pricingCategory),
    overrideBps: merchant.commissionBps,
    isIndependent: merchant.isIndependent,
    introRateStartedAt: merchant.introRateStartedAt,
    config,
  });
  const courier = courierPay({
    km: quote.distanceKm,
    peakFeeCents: quote.peakFeeCents,
    tipCents: quote.tipCents,
    config,
  });
  const totals = {
    itemTotalCents: quote.itemTotalCents,
    deliveryFeeCents: quote.deliveryFeeCents,
    serviceFeeCents: quote.serviceFeeCents,
    totalCents: quote.totalCents,
  };

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        customerId: params.customerId,
        merchantId,
        zoneId: zone.id,
        addressId: address.id,
        status: OrderStatus.PAYMENT_PENDING,
        itemTotalCents: totals.itemTotalCents,
        deliveryFeeCents: totals.deliveryFeeCents,
        serviceFeeCents: totals.serviceFeeCents,
        smallOrderFeeCents: quote.smallOrderFeeCents,
        peakFeeCents: quote.peakFeeCents,
        tipCents: quote.tipCents,
        deliveryDistanceKm: quote.distanceKm,
        distanceSource: quote.distanceSource,
        plusApplied: quote.plusApplied,
        pricingJson: JSON.stringify({ quote, commission, courier }),
        totalCents: totals.totalCents,
        customerNotes: params.customerNotes,
        idempotencyKey: params.idempotencyKey,
        items: {
          create: basket.items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            description: item.product.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.unitPriceCents * item.quantity,
            notes: item.notes,
            inventoryOwner: item.product.inventoryOwner,
          })),
        },
        events: {
          create: [
            {
              fromStatus: OrderStatus.CHECKOUT_INITIATED,
              toStatus: OrderStatus.PAYMENT_PENDING,
              actorRole: Role.CUSTOMER,
              actorId: params.userId,
              note: "Checkout initiated; payment pending",
            },
          ],
        },
      },
      include: { items: true, payment: true },
    });

    await tx.basketItem.deleteMany({ where: { basketId: basket.id } });
    return created;
  });

  const intent = await createPaymentIntent({
    orderId: order.id,
    amountCents: order.totalCents,
    idempotencyKey: `pay_${params.idempotencyKey}`,
  });

  if (!params.simulatePaymentSuccess) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAYMENT_FAILED },
    });
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: OrderStatus.PAYMENT_PENDING,
        toStatus: OrderStatus.PAYMENT_FAILED,
        actorRole: Role.CUSTOMER,
        actorId: params.userId,
        note: "Payment not confirmed by provider",
      },
    });
    throw new Error("Payment was not completed");
  }

  // Simulate verified provider callback (NOT browser redirect alone)
  const confirmed = await confirmPaymentFromProvider({
    providerRef: intent.checkoutToken,
    amountCents: order.totalCents,
    success: true,
    rawPayload: {
      mock: true,
      note: "Simulated verified IPN — replace with real payment gateway",
    },
  });

  if (!confirmed.ok) {
    await transitionOrder({
      orderId: order.id,
      toStatus: OrderStatus.PAYMENT_FAILED,
      actorId: params.userId,
      note: confirmed.error,
      system: true,
    });
    throw new Error(confirmed.error ?? "Payment failed");
  }

  await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.SUBMITTED,
    actorId: params.userId,
    note: "Payment captured via provider callback",
    system: true,
  });
  await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.MERCHANT_PENDING,
    actorId: params.userId,
    note: "Awaiting merchant acceptance",
    system: true,
  });

  await writeAudit({
    actorId: params.userId,
    entityType: "ORDER",
    entityId: order.id,
    action: "ORDER_PLACED",
    detail: { orderNumber: order.orderNumber, totalCents: order.totalCents },
  });

  return prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: {
      items: true,
      payment: true,
      merchant: true,
      address: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function transitionOrder(params: {
  orderId: string;
  toStatus: OrderStatus;
  actorRole?: Role;
  actorId?: string;
  note?: string;
  rejectReason?: string;
  cancelReason?: string;
  /** Trusted server/payment paths may omit role checks */
  system?: boolean;
}) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: params.orderId },
    include: { payment: true, merchant: true, delivery: true },
  });

  assertTransition(
    order.status,
    params.toStatus,
    params.system ? undefined : params.actorRole,
  );

  const data: Prisma.OrderUpdateInput = {
    status: params.toStatus,
  };

  if (params.toStatus === OrderStatus.ACCEPTED) data.acceptedAt = new Date();
  if (params.toStatus === OrderStatus.READY_FOR_COLLECTION)
    data.readyAt = new Date();
  if (params.toStatus === OrderStatus.DELIVERED) data.deliveredAt = new Date();
  if (params.toStatus === OrderStatus.CANCELLED) {
    data.cancelledAt = new Date();
    data.cancelReason = params.cancelReason;
  }
  if (params.toStatus === OrderStatus.REJECTED) {
    data.rejectReason = params.rejectReason;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: params.toStatus,
        actorRole: params.actorRole,
        actorId: params.actorId,
        note: params.note ?? params.rejectReason ?? params.cancelReason,
      },
    });

    // Merchant reject after payment → refund pending
    if (
      params.toStatus === OrderStatus.REJECTED ||
      params.toStatus === OrderStatus.MERCHANT_UNAVAILABLE
    ) {
      if (order.payment?.status === PaymentStatus.CAPTURED) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUND_PENDING },
        });
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            fromStatus: params.toStatus,
            toStatus: OrderStatus.REFUND_PENDING,
            actorRole: Role.ADMIN,
            note: "Authorised payment requires refund after merchant rejection",
          },
        });
      }
    }

    if (params.toStatus === OrderStatus.READY_FOR_COLLECTION) {
      await tx.deliveryAssignment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          status: DeliveryAssignmentStatus.OFFERED,
        },
        update: { status: DeliveryAssignmentStatus.OFFERED },
      });
    }

    if (params.toStatus === OrderStatus.DELIVERED) {
      const config = pricingFromSettings(
        await tx.platformSettings.findUnique({ where: { id: "default" } }),
      );
      const snapshot = order.pricingJson
        ? (JSON.parse(order.pricingJson) as {
            commission?: { bps: number };
            courier?: ReturnType<typeof courierPay>;
          })
        : {};
      const rate =
        snapshot.commission?.bps ??
        commissionBps({
          category: normalisePricingCategory(order.merchant.pricingCategory),
          overrideBps: order.merchant.commissionBps,
          isIndependent: order.merchant.isIndependent,
          introRateStartedAt: order.merchant.introRateStartedAt,
          config,
        }).bps;
      const commissionAmount = commissionCents(order.itemTotalCents, rate);
      await tx.merchantCommission.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          merchantId: order.merchantId,
          orderTotalCents: order.itemTotalCents,
          rateBps: rate,
          commissionCents: commissionAmount,
          netPayoutCents: order.itemTotalCents - commissionAmount,
        },
        update: {},
      });

      if (order.delivery?.courierId) {
        const pay =
          snapshot.courier ??
          courierPay({
            km: order.deliveryDistanceKm ?? config.fallbackDistanceKm,
            peakFeeCents: order.peakFeeCents,
            tipCents: order.tipCents,
            config,
          });
        await tx.courierEarning.upsert({
          where: { orderId: order.id },
          create: {
            courierId: order.delivery.courierId,
            orderId: order.id,
            amountCents: pay.totalCents,
            tipCents: pay.tipCents,
            breakdownJson: JSON.stringify(pay),
          },
          update: {},
        });
      }
    }
  });

  await writeAudit({
    actorId: params.actorId,
    entityType: "ORDER",
    entityId: order.id,
    action: `STATUS_${params.toStatus}`,
    detail: { from: order.status, to: params.toStatus, note: params.note },
  });

  return prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: {
      items: true,
      payment: true,
      merchant: true,
      delivery: { include: { courier: { include: { user: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      address: true,
    },
  });
}

export async function assignCourier(params: {
  orderId: string;
  courierId: string;
  actorId: string;
  actorRole: Role;
}) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: params.orderId },
    include: { delivery: true },
  });

  if (
    order.status !== OrderStatus.READY_FOR_COLLECTION &&
    order.status !== OrderStatus.COURIER_ASSIGNED &&
    order.status !== OrderStatus.DELIVERY_FAILED
  ) {
    throw new Error("Order is not ready for courier assignment");
  }

  const courier = await prisma.courierProfile.findUniqueOrThrow({
    where: { id: params.courierId },
  });
  if (courier.status !== "APPROVED") {
    throw new Error("Courier is not approved");
  }

  await prisma.deliveryAssignment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      courierId: courier.id,
      status: DeliveryAssignmentStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
    update: {
      courierId: courier.id,
      status: DeliveryAssignmentStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
  });

  if (order.status !== OrderStatus.COURIER_ASSIGNED) {
    return transitionOrder({
      orderId: order.id,
      toStatus: OrderStatus.COURIER_ASSIGNED,
      actorRole: params.actorRole,
      actorId: params.actorId,
      note: "Courier assigned",
    });
  }

  return prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: {
      items: true,
      payment: true,
      merchant: true,
      delivery: { include: { courier: { include: { user: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      address: true,
    },
  });
}
