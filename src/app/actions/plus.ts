"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { loadPricingConfig } from "@/lib/pricing-server";

async function profileId() {
  const user = await requireUser(["CUSTOMER"]);
  const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  return { user, customerId: profile.id };
}

/** Activates THUMA Plus benefits. No billing: billingStatus stays NOT_YET_BILLED. */
export async function joinPlusAction() {
  const { user, customerId } = await profileId();
  const config = await loadPricingConfig();
  if (!config.plusEnabled) throw new Error("THUMA Plus is not available");
  await prisma.plusSubscription.upsert({
    where: { customerId },
    create: { customerId, priceCents: config.plusMonthlyPriceCents },
    update: {
      status: "ACTIVE",
      cancelledAt: null,
      priceCents: config.plusMonthlyPriceCents,
      billingStatus: "NOT_YET_BILLED",
    },
  });
  await writeAudit({ actorId: user.id, entityType: "PLUS", entityId: customerId, action: "PLUS_JOINED" });
  revalidatePath("/account");
  revalidatePath("/basket");
}

export async function cancelPlusAction() {
  const { user, customerId } = await profileId();
  await prisma.plusSubscription.updateMany({
    where: { customerId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  await writeAudit({ actorId: user.id, entityType: "PLUS", entityId: customerId, action: "PLUS_CANCELLED" });
  revalidatePath("/account");
  revalidatePath("/basket");
}
