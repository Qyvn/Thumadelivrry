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
  await addToBasket({
    customerId: customer.customerProfile.id,
    productId: product.id,
    quantity: 1,
  });

  const address = customer.customerProfile.addresses[0];
  const order = await checkoutOrder({
    customerId: customer.customerProfile.id,
    userId: customer.id,
    addressId: address.id,
    idempotencyKey: `e2e_${Date.now()}`,
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
