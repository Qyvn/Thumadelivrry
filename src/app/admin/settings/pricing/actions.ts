"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { fromForm, PRICING_SECTIONS } from "@/lib/pricing-fields";
import { parsePeakWindows, validatePeakWindow, type PeakWindow } from "@/lib/peak";

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

async function savePeakWindows(windows: PeakWindow[], actorId: string, action: string) {
  const peakWindowsJson = JSON.stringify(windows);
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", peakWindowsJson },
    update: { peakWindowsJson },
  });
  await writeAudit({ actorId, entityType: "SETTINGS", entityId: "default", action, detail: { windows } });
  revalidatePath("/admin/settings/pricing");
}

export async function addPeakWindowAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  let next: PeakWindow[] = [];
  try {
    const w = validatePeakWindow({
      days: formData.getAll("days").map(Number),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
    });
    const row = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    next = [...parsePeakWindows(row?.peakWindowsJson), w];
    if (next.length > 20) throw new Error("Maximum 20 peak windows");
  } catch (e) {
    redirect(`/admin/settings/pricing?error=${encodeURIComponent((e as Error).message)}#peak`);
  }
  await savePeakWindows(next, user.id, "PEAK_WINDOW_ADDED");
  redirect("/admin/settings/pricing?saved=1#peak");
}

export async function removePeakWindowAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const index = Number(formData.get("index"));
  const row = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  const windows = parsePeakWindows(row?.peakWindowsJson);
  if (Number.isInteger(index) && index >= 0 && index < windows.length) windows.splice(index, 1);
  await savePeakWindows(windows, user.id, "PEAK_WINDOW_REMOVED");
  redirect("/admin/settings/pricing?saved=1#peak");
}
