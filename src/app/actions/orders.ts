"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus, Role } from "@/lib/constants";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assignCourier, transitionOrder } from "@/lib/orders";
import { initiateRefund } from "@/lib/payments";

export async function merchantOrderAction(formData: FormData) {
  const user = await requireUser([Role.MERCHANT_STAFF, Role.ADMIN]);
  const orderId = String(formData.get("orderId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "") || undefined;

  const staff = await prisma.merchantStaff.findFirst({
    where: { userId: user.id },
  });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect("/merchant?error=Order+not+found");
  if (
    user.role === Role.MERCHANT_STAFF &&
    (!staff || staff.merchantId !== order.merchantId)
  ) {
    redirect("/merchant?error=Unauthorised");
  }

  const map: Record<string, OrderStatus> = {
    accept: OrderStatus.ACCEPTED,
    reject: OrderStatus.REJECTED,
    prepare: OrderStatus.PREPARING,
    ready: OrderStatus.READY_FOR_COLLECTION,
  };
  const toStatus = map[action];
  if (!toStatus) redirect("/merchant?error=Unknown+action");

  try {
    // After accept, auto-move to preparing for a smoother pilot UX
    await transitionOrder({
      orderId,
      toStatus,
      actorRole: user.role,
      actorId: user.id,
      rejectReason: action === "reject" ? reason : undefined,
      note: reason,
    });
    if (action === "accept") {
      await transitionOrder({
        orderId,
        toStatus: OrderStatus.PREPARING,
        actorRole: user.role,
        actorId: user.id,
        note: "Preparation started",
      });
    }
  } catch (e) {
    redirect(`/merchant?error=${encodeURIComponent((e as Error).message)}`);
  }

  revalidatePath("/merchant");
  revalidatePath(`/orders/${orderId}`);
  redirect("/merchant");
}

export async function courierOrderAction(formData: FormData) {
  const user = await requireUser([Role.COURIER, Role.ADMIN]);
  const orderId = String(formData.get("orderId") ?? "");
  const action = String(formData.get("action") ?? "");
  const proof = String(formData.get("proof") ?? "") || undefined;

  const courier = await prisma.courierProfile.findUnique({
    where: { userId: user.id },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });
  if (!order) redirect("/courier?error=Order+not+found");

  if (action === "claim") {
    if (!courier) redirect("/courier?error=No+courier+profile");
    try {
      await assignCourier({
        orderId,
        courierId: courier.id,
        actorId: user.id,
        actorRole: user.role,
      });
    } catch (e) {
      redirect(`/courier?error=${encodeURIComponent((e as Error).message)}`);
    }
    revalidatePath("/courier");
    redirect("/courier");
  }

  if (
    user.role === Role.COURIER &&
    order.delivery?.courierId !== courier?.id
  ) {
    redirect("/courier?error=Not+your+assignment");
  }

  const map: Record<string, OrderStatus> = {
    collect: OrderStatus.COLLECTED,
    transit: OrderStatus.IN_TRANSIT,
    deliver: OrderStatus.DELIVERED,
    fail: OrderStatus.DELIVERY_FAILED,
  };
  const toStatus = map[action];
  if (!toStatus) redirect("/courier?error=Unknown+action");

  try {
    if (action === "collect") {
      await transitionOrder({
        orderId,
        toStatus: OrderStatus.COLLECTED,
        actorRole: user.role,
        actorId: user.id,
      });
      await transitionOrder({
        orderId,
        toStatus: OrderStatus.IN_TRANSIT,
        actorRole: user.role,
        actorId: user.id,
        note: "En route to customer",
      });
    } else {
      await transitionOrder({
        orderId,
        toStatus,
        actorRole: user.role,
        actorId: user.id,
        note: proof,
      });
    }

    if (action === "deliver" && order.delivery) {
      await prisma.deliveryAssignment.update({
        where: { id: order.delivery.id },
        data: {
          status: "COMPLETED",
          deliveredAt: new Date(),
          proofOfDelivery: proof ?? "Customer confirmed receipt",
        },
      });
    }
  } catch (e) {
    redirect(`/courier?error=${encodeURIComponent((e as Error).message)}`);
  }

  revalidatePath("/courier");
  redirect("/courier");
}

export async function adminAssignCourierAction(formData: FormData) {
  const user = await requireUser([Role.ADMIN, Role.SUPPORT]);
  const orderId = String(formData.get("orderId") ?? "");
  const courierId = String(formData.get("courierId") ?? "");
  try {
    await assignCourier({
      orderId,
      courierId,
      actorId: user.id,
      actorRole: user.role,
    });
  } catch (e) {
    redirect(`/admin/orders?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/admin");
  redirect("/admin/orders");
}

export async function adminRefundAction(formData: FormData) {
  const user = await requireUser([Role.ADMIN, Role.SUPPORT]);
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "Authorised refund");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order?.payment) {
    redirect("/admin/orders?error=No+payment");
  }

  const result = await initiateRefund({
    paymentId: order.payment.id,
    amountCents: order.payment.amountCents,
    reason,
  });
  if (!result.ok) {
    redirect(`/admin/orders?error=${encodeURIComponent(result.error ?? "Refund failed")}`);
  }

  await transitionOrder({
    orderId,
    toStatus: OrderStatus.REFUNDED,
    actorRole: user.role,
    actorId: user.id,
    note: reason,
  }).catch(async () => {
    // Allow refund status if already REFUND_PENDING or force via admin path
    if (order.status !== OrderStatus.REFUND_PENDING) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      });
    } else {
      await transitionOrder({
        orderId,
        toStatus: OrderStatus.REFUNDED,
        actorRole: Role.ADMIN,
        actorId: user.id,
        note: reason,
      });
    }
  });

  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}

export async function cancelOrderAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "Customer cancelled");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });
  if (!order) redirect("/orders");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (
    user.role === Role.CUSTOMER &&
    profile?.id !== order.customerId
  ) {
    redirect("/orders");
  }

  try {
    await transitionOrder({
      orderId,
      toStatus: OrderStatus.CANCELLED,
      actorRole: user.role,
      actorId: user.id,
      cancelReason: reason,
    });
  } catch (e) {
    redirect(`/orders/${orderId}?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}
