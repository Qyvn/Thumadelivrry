"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { DURBAN_CENTER } from "@/lib/zones-constants";
import { getLaunchZone } from "@/lib/zones";

export async function approveMerchantAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const applicationId = String(formData.get("applicationId") ?? "");
  const app = await prisma.merchantApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) redirect("/admin");

  const zone = await getLaunchZone();

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

/** Update minimum merchandise subtotal required for delivery (ZAR cents). */
export async function updateZoneRadiusAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const zoneId = String(formData.get("zoneId") ?? "");
  const radiusKm = Number(formData.get("radiusKm") ?? 0);
  if (!zoneId || !Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
    redirect("/admin?error=Radius+must+be+between+0.1+and+100+km");
  }

  const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
  if (!zone) redirect("/admin?error=Zone+not+found");

  let boundary: Record<string, unknown> = {};
  try {
    boundary = zone.boundaryJson ? JSON.parse(zone.boundaryJson) : {};
  } catch {
    boundary = {};
  }
  boundary.type = boundary.type ?? "radius";
  boundary.radiusKm = radiusKm;
  if (!boundary.center) {
    boundary.center = { ...DURBAN_CENTER };
  }

  await prisma.deliveryZone.update({
    where: { id: zoneId },
    data: { boundaryJson: JSON.stringify(boundary) },
  });

  await writeAudit({
    actorId: user.id,
    entityType: "ZONE",
    entityId: zoneId,
    action: "ZONE_RADIUS_UPDATED",
    detail: { radiusKm },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}
