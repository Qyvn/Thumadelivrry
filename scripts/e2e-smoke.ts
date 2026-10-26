import { PrismaClient } from "@prisma/client";
import {
  addToBasket,
  assignCourier,
  checkoutOrder,
  transitionOrder,
} from "../src/lib/orders";
import { OrderStatus, Role } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.user.findUnique({
    where: { email: "customer@thuma.local" },
    include: { customerProfile: { include: { addresses: true } } },
  });
  if (!customer?.customerProfile) throw new Error("no customer");
  const product = await prisma.product.findFirst({
    where: { slug: "bunny-chow-chicken" },
  });
  if (!product) throw new Error("no product");

  await prisma.basketItem.deleteMany({
    where: { basket: { customerId: customer.customerProfile.id } },
  });
  // Bunny chow (FOOD) qty 3 = R225: above R60 food minimum and R100 small-order threshold
  await addToBasket({
    customerId: customer.customerProfile.id,
    productId: product.id,
    quantity: 3,
  });

  const address = customer.customerProfile.addresses[0];
  const order = await checkoutOrder({
    customerId: customer.customerProfile.id,
    userId: customer.id,
    addressId: address.id,
    idempotencyKey: `e2e_${Date.now()}`,
    tipCents: 1000,
    simulatePaymentSuccess: true,
    customerNotes: "E2E smoke",
  });
  console.log("placed", order.orderNumber, order.status);

  const merchantUser = await prisma.user.findUniqueOrThrow({
    where: { email: "merchant@thuma.local" },
  });
  await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.ACCEPTED,
    actorRole: Role.MERCHANT_STAFF,
    actorId: merchantUser.id,
  });
  await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.PREPARING,
    actorRole: Role.MERCHANT_STAFF,
    actorId: merchantUser.id,
  });
  await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.READY_FOR_COLLECTION,
    actorRole: Role.MERCHANT_STAFF,
    actorId: merchantUser.id,
  });

  const courier = await prisma.courierProfile.findFirstOrThrow({
    where: { user: { email: "courier@thuma.local" } },
  });
  await assignCourier({
    orderId: order.id,
    courierId: courier.id,
    actorId: courier.userId,
    actorRole: Role.COURIER,
  });
  await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.COLLECTED,
    actorRole: Role.COURIER,
    actorId: courier.userId,
  });
  await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.IN_TRANSIT,
    actorRole: Role.COURIER,
    actorId: courier.userId,
  });
  const delivered = await transitionOrder({
    orderId: order.id,
    toStatus: OrderStatus.DELIVERED,
    actorRole: Role.COURIER,
    actorId: courier.userId,
  });
  const placed = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  const earning = await prisma.courierEarning.findUniqueOrThrow({ where: { orderId: order.id } });
  const commission = await prisma.merchantCommission.findUniqueOrThrow({ where: { orderId: order.id } });
  const expectTotal =
    placed.itemTotalCents + placed.deliveryFeeCents + placed.serviceFeeCents +
    placed.smallOrderFeeCents + placed.peakFeeCents + placed.tipCents;
  if (placed.totalCents !== expectTotal) throw new Error("order total does not add up");
  if (placed.smallOrderFeeCents !== 0) throw new Error("unexpected small-order fee");
  if (placed.tipCents !== 1000 || earning.tipCents !== 1000) throw new Error("tip must pass 100% to courier");
  if (earning.amountCents < 2500 + 1000) throw new Error("courier pay below R25 base + tip");
  if (commission.rateBps !== 1500) throw new Error(`expected 15% restaurant commission, got ${commission.rateBps}`);
  console.log(
    "fees",
    JSON.stringify({
      km: placed.deliveryDistanceKm,
      source: placed.distanceSource,
      delivery: placed.deliveryFeeCents,
      service: placed.serviceFeeCents,
      tip: placed.tipCents,
      total: placed.totalCents,
      courierPay: earning.amountCents,
      commissionBps: commission.rateBps,
    }),
  );
  console.log(
    "final",
    delivered.orderNumber,
    delivered.status,
    delivered.payment?.status,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
