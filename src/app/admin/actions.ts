"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function approveMerchantAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const applicationId = String(formData.get("applicationId") ?? "");
  const app = await prisma.merchantApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) redirect("/admin");

  const zone = await prisma.deliveryZone.findUnique({
    where: { slug: "cornubia-flats" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.merchantApplication.update({
      where: { id: app.id },
      data: { status: "APPROVED" },
    });
    const existing = await tx.merchant.findUnique({
      where: { applicationId: app.id },
    });
    if (!existing) {
      await tx.merchant.create({
        data: {
          applicationId: app.id,
          name: app.businessName,
          slug: slugify(`${app.businessName}-${app.id.slice(-4)}`),
          email: app.contactEmail,
          phone: app.contactPhone,
          status: "APPROVED",
          addressLine1: app.addressLine1,
          suburb: app.suburb,
          city: app.city,
          zoneId: zone?.id,
          isDevSample: false,
        },
      });
    } else {
      await tx.merchant.update({
        where: { id: existing.id },
        data: { status: "APPROVED", zoneId: zone?.id },
      });
    }
  });

  await writeAudit({
    actorId: user.id,
    entityType: "MERCHANT",
    entityId: applicationId,
    action: "MERCHANT_APPROVED",
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function toggleZoneAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const zoneId = String(formData.get("zoneId") ?? "");
  const isActive = formData.get("isActive") === "true";
  await prisma.deliveryZone.update({
    where: { id: zoneId },
    data: { isActive },
  });
  await writeAudit({
    actorId: user.id,
    entityType: "ZONE",
    entityId: zoneId,
    action: isActive ? "ZONE_ACTIVATED" : "ZONE_DEACTIVATED",
  });
  revalidatePath("/admin");
  redirect("/admin");
}
