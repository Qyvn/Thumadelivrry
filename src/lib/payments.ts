import { Prisma } from "@prisma/client";
import { PaymentStatus } from "@/lib/constants";
import { prisma } from "./db";

/**
 * Mock South African payment provider (PayFast-shaped).
 * This NEVER marks an order paid based on a browser success redirect alone.
 * Capture requires an explicit server-side confirmPayment() call simulating
 * a verified provider callback. Replace with real PayFast/Peach/Ozow when credentials exist.
 */
export async function createPaymentIntent(params: {
  orderId: string;
  amountCents: number;
  idempotencyKey: string;
}): Promise<{ paymentId: string; checkoutToken: string; status: PaymentStatus }> {
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) {
    return {
      paymentId: existing.id,
      checkoutToken: existing.providerRef ?? existing.id,
      status: existing.status as PaymentStatus,
    };
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: params.orderId,
      amountCents: params.amountCents,
      currency: "ZAR",
      status: PaymentStatus.PENDING,
      provider: process.env.PAYMENT_PROVIDER ?? "mock_payfast",
      idempotencyKey: params.idempotencyKey,
      providerRef: `mock_${params.idempotencyKey}`,
    },
  });

  return {
    paymentId: payment.id,
    checkoutToken: payment.providerRef!,
    status: payment.status as PaymentStatus,
  };
}

/**
 * Simulates a verified provider IPN/callback.
 * In production, verify signature, amount, and merchant ID before calling this.
 */
export async function confirmPaymentFromProvider(params: {
  providerRef: string;
  amountCents: number;
  success: boolean;
  rawPayload?: Record<string, unknown>;
}): Promise<{ ok: boolean; paymentId?: string; error?: string }> {
  const payment = await prisma.payment.findFirst({
    where: { providerRef: params.providerRef },
    include: { order: true },
  });

  if (!payment) {
    return { ok: false, error: "Payment not found" };
  }

  if (payment.status === PaymentStatus.CAPTURED) {
    return { ok: true, paymentId: payment.id };
  }

  if (payment.amountCents !== params.amountCents) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: "Amount mismatch on provider callback",
        rawCallbackJson: JSON.stringify(params.rawPayload ?? {}),
      },
    });
    return { ok: false, error: "Amount mismatch" };
  }

  if (!params.success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: "Provider reported failure",
        rawCallbackJson: JSON.stringify(params.rawPayload ?? {}),
      },
    });
    return { ok: false, paymentId: payment.id, error: "Payment failed" };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.CAPTURED,
      paidAt: new Date(),
      rawCallbackJson: JSON.stringify(params.rawPayload ?? { mock: true }),
    },
  });

  return { ok: true, paymentId: payment.id };
}

export async function initiateRefund(params: {
  paymentId: string;
  amountCents: number;
  reason: string;
}): Promise<{ ok: boolean; error?: string }> {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
  });
  if (!payment || payment.status !== PaymentStatus.CAPTURED) {
    return { ok: false, error: "Payment not eligible for refund" };
  }
  if (params.amountCents > payment.amountCents) {
    return { ok: false, error: "Refund exceeds payment amount" };
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.refund.create({
      data: {
        paymentId: payment.id,
        amountCents: params.amountCents,
        reason: params.reason,
        status: PaymentStatus.REFUNDED,
        providerRef: `mock_refund_${Date.now()}`,
      },
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });
  });

  return { ok: true };
}
