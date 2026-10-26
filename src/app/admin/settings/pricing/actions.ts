"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { fromForm, PRICING_SECTIONS } from "@/lib/pricing-fields";

export async function updatePricingAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const data: Record<string, number | boolean> = {};
  try {
    for (const section of PRICING_SECTIONS) {
      for (const f of section.fields) data[f.key] = fromForm(f.unit, formData.get(f.key));
    }
    if (
      !((data.deliveryBand1MaxKm as number) < (data.deliveryBand2MaxKm as number) &&
        (data.deliveryBand2MaxKm as number) < (data.deliveryBand3MaxKm as number))
    ) {
      throw new Error("Distance bands must increase (band 1 < band 2 < band 3)");
    }
  } catch (e) {
    redirect(`/admin/settings/pricing?error=${encodeURIComponent((e as Error).message)}`);
  }
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });
  await writeAudit({
    actorId: user.id,
    entityType: "SETTINGS",
    entityId: "default",
    action: "PRICING_UPDATED",
    detail: data,
  });
  revalidatePath("/admin/settings/pricing");
  redirect("/admin/settings/pricing?saved=1");
}
