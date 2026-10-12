import { OrderStatus, Role } from "@/lib/constants";

/**
 * Server-controlled order state machine.
 * Every transition must be validated here before persisting.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  BASKET: [OrderStatus.CHECKOUT_INITIATED, OrderStatus.CANCELLED],
  CHECKOUT_INITIATED: [
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.CANCELLED,
    OrderStatus.PAYMENT_FAILED,
  ],
  PAYMENT_PENDING: [
    OrderStatus.SUBMITTED,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  SUBMITTED: [OrderStatus.MERCHANT_PENDING, OrderStatus.CANCELLED],
  MERCHANT_PENDING: [
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
    OrderStatus.MERCHANT_UNAVAILABLE,
    OrderStatus.CANCELLED,
  ],
  ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  REJECTED: [OrderStatus.REFUND_PENDING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY_FOR_COLLECTION, OrderStatus.CANCELLED],
  READY_FOR_COLLECTION: [
    OrderStatus.COURIER_ASSIGNED,
    OrderStatus.CANCELLED,
  ],
  COURIER_ASSIGNED: [
    OrderStatus.COLLECTED,
    OrderStatus.DELIVERY_FAILED,
    OrderStatus.CANCELLED,
  ],
  COLLECTED: [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERY_FAILED],
  IN_TRANSIT: [OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED],
  DELIVERED: [OrderStatus.REFUND_PENDING],
  CANCELLED: [OrderStatus.REFUND_PENDING],
  PAYMENT_FAILED: [],
  MERCHANT_UNAVAILABLE: [OrderStatus.REFUND_PENDING],
  DELIVERY_FAILED: [OrderStatus.REFUND_PENDING, OrderStatus.COURIER_ASSIGNED],
  REFUND_PENDING: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

const ROLE_ACTIONS: Partial<Record<Role, OrderStatus[]>> = {
  CUSTOMER: [OrderStatus.CANCELLED],
  MERCHANT_STAFF: [
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
    OrderStatus.MERCHANT_UNAVAILABLE,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_COLLECTION,
  ],
  COURIER: [
    OrderStatus.COURIER_ASSIGNED,
    OrderStatus.COLLECTED,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERY_FAILED,
  ],
  ADMIN: Object.values(OrderStatus),
  SUPPORT: [
    OrderStatus.CANCELLED,
    OrderStatus.REFUND_PENDING,
    OrderStatus.REFUNDED,
    OrderStatus.COURIER_ASSIGNED,
  ],
};

export function canTransition(from: string, to: string): boolean {
  return TRANSITIONS[from as OrderStatus]?.includes(to as OrderStatus) ?? false;
}

export function roleCanSetStatus(role: string, to: string): boolean {
  const allowed = ROLE_ACTIONS[role as Role];
  if (!allowed) return false;
  if (role === Role.ADMIN) return true;
  return allowed.includes(to as OrderStatus);
}

export function assertTransition(
  from: string,
  to: string,
  role?: Role,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid order transition: ${from} → ${to}`);
  }
  if (role && !roleCanSetStatus(role, to)) {
    throw new Error(`Role ${role} cannot set status ${to}`);
  }
}

export const CUSTOMER_VISIBLE_STEPS: OrderStatus[] = [
  OrderStatus.SUBMITTED,
  OrderStatus.MERCHANT_PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_COLLECTION,
  OrderStatus.COURIER_ASSIGNED,
  OrderStatus.COLLECTED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
];

/** Statuses where the customer no longer needs live refresh. */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.REJECTED,
  OrderStatus.MERCHANT_UNAVAILABLE,
];

export function isTerminalOrderStatus(status: string): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status as OrderStatus);
}

export function statusLabel(status: string): string {
  const labels: Record<OrderStatus, string> = {
    BASKET: "Basket",
    CHECKOUT_INITIATED: "Checkout started",
    PAYMENT_PENDING: "Awaiting payment",
    SUBMITTED: "Order placed",
    MERCHANT_PENDING: "Awaiting merchant confirmation",
    ACCEPTED: "Merchant confirmed",
    REJECTED: "Rejected by merchant",
    PREPARING: "Preparing your order",
    READY_FOR_COLLECTION: "Ready for collection",
    COURIER_ASSIGNED: "Delivery partner assigned",
    COLLECTED: "Collected",
    IN_TRANSIT: "On the way",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    PAYMENT_FAILED: "Payment failed",
    MERCHANT_UNAVAILABLE: "Merchant unavailable",
    DELIVERY_FAILED: "Delivery failed",
    REFUND_PENDING: "Refund pending",
    REFUNDED: "Refunded",
  };
  return labels[status as OrderStatus] ?? status.replaceAll("_", " ");
}
