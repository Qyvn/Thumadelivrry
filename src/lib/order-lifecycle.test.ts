import { OrderStatus, Role } from "@/lib/constants";
import { canTransition, roleCanSetStatus } from "./order-lifecycle";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  canTransition(OrderStatus.MERCHANT_PENDING, OrderStatus.ACCEPTED),
  "merchant pending → accepted",
);
assert(
  !canTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING),
  "delivered cannot go back to preparing",
);
assert(
  roleCanSetStatus(Role.MERCHANT_STAFF, OrderStatus.READY_FOR_COLLECTION),
  "merchant can mark ready",
);
assert(
  !roleCanSetStatus(Role.CUSTOMER, OrderStatus.DELIVERED),
  "customer cannot mark delivered",
);
assert(
  canTransition(OrderStatus.PAYMENT_PENDING, OrderStatus.PAYMENT_FAILED),
  "payment pending → failed",
);

console.log("order-lifecycle.test.ts: all assertions passed");
