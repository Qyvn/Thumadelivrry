/** Shared string unions — SQLite stores these as strings. */

export const Role = {
  CUSTOMER: "CUSTOMER",
  MERCHANT_STAFF: "MERCHANT_STAFF",
  COURIER: "COURIER",
  ADMIN: "ADMIN",
  SUPPORT: "SUPPORT",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MerchantStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
} as const;
export type MerchantStatus = (typeof MerchantStatus)[keyof typeof MerchantStatus];

export const CourierStatus = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
} as const;
export type CourierStatus = (typeof CourierStatus)[keyof typeof CourierStatus];

export const ServiceCategoryCode = {
  EATS: "EATS",
  MARKET: "MARKET",
  LOCAL: "LOCAL",
  EXPRESS: "EXPRESS",
} as const;
export type ServiceCategoryCode =
  (typeof ServiceCategoryCode)[keyof typeof ServiceCategoryCode];

export const InventoryOwner = {
  MERCHANT: "MERCHANT",
  THUMA: "THUMA",
} as const;
export type InventoryOwner =
  (typeof InventoryOwner)[keyof typeof InventoryOwner];

export const OrderStatus = {
  BASKET: "BASKET",
  CHECKOUT_INITIATED: "CHECKOUT_INITIATED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  SUBMITTED: "SUBMITTED",
  MERCHANT_PENDING: "MERCHANT_PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  PREPARING: "PREPARING",
  READY_FOR_COLLECTION: "READY_FOR_COLLECTION",
  COURIER_ASSIGNED: "COURIER_ASSIGNED",
  COLLECTED: "COLLECTED",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  MERCHANT_UNAVAILABLE: "MERCHANT_UNAVAILABLE",
  DELIVERY_FAILED: "DELIVERY_FAILED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  NOT_STARTED: "NOT_STARTED",
  PENDING: "PENDING",
  AUTHORISED: "AUTHORISED",
  CAPTURED: "CAPTURED",
  FAILED: "FAILED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const DeliveryAssignmentStatus = {
  OFFERED: "OFFERED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type DeliveryAssignmentStatus =
  (typeof DeliveryAssignmentStatus)[keyof typeof DeliveryAssignmentStatus];

export const SupportTicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type SupportTicketStatus =
  (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];

export const AuditEntityType = {
  USER: "USER",
  MERCHANT: "MERCHANT",
  ORDER: "ORDER",
  PAYMENT: "PAYMENT",
  ZONE: "ZONE",
  PRODUCT: "PRODUCT",
  COURIER: "COURIER",
  SETTINGS: "SETTINGS",
  PLUS: "PLUS",
} as const;
export type AuditEntityType =
  (typeof AuditEntityType)[keyof typeof AuditEntityType];
