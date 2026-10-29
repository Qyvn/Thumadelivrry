"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function reviewGemAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "SUPPORT"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim() || null;
  if (!id || !["APPROVED", "REJECTED", "SUSPENDED"].includes(decision)) {
    redirect("/admin/gems?error=Invalid+review");
  }
  await prisma.hiddenGem.update({
    where: { id },
    data: {
      status: decision,
      reviewNotes,
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });
  revalidatePath("/gems");
  revalidatePath("/admin/gems");
  redirect(`/admin/gems?saved=${decision}`);
}

/* ---- Owner dashboard: add / edit / photo upload / publish toggle ---- */

const CATS = ["BEACH", "FOOD", "NATURE", "CULTURE", "NIGHTLIFE", "SHOPPING", "OTHER"];
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "gem";

async function savePhoto(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  if (!ext) throw new Error("Photo must be JPG, PNG or WebP");
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be under 5 MB");
  // Local/dev storage. On Vercel the filesystem is read-only/ephemeral: swap for blob storage before production.
  const dir = path.join(process.cwd(), "public", "uploads", "gems");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/gems/${name}`;
}

export async function saveGemAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "SUPPORT"]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "OTHER");
  const publish = formData.get("publish") === "on";
  if (!name || !area || !description || !CATS.includes(category)) {
    redirect(`/admin/gems?error=${encodeURIComponent("Name, area, category and description are required")}${id ? `&edit=${id}` : ""}`);
  }
  let imageUrl: string | null = null;
  try {
    imageUrl = await savePhoto(formData.get("photo"));
  } catch (e) {
    redirect(`/admin/gems?error=${encodeURIComponent((e as Error).message)}`);
  }
  const status = publish ? "APPROVED" : "SUSPENDED";
  if (id) {
    await prisma.hiddenGem.update({
      where: { id },
      data: { name, area, description, category, status, ...(imageUrl ? { imageUrl } : {}), reviewedAt: new Date(), reviewedById: user.id },
    });
  } else {
    let slug = slugify(name);
    if (await prisma.hiddenGem.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    await prisma.hiddenGem.create({
      data: { name, slug, area, description, category, status, imageUrl, submitterName: `Owner (${user.fullName})`, reviewedAt: new Date(), reviewedById: user.id },
    });
  }
  revalidatePath("/gems");
  revalidatePath("/admin/gems");
  redirect(`/admin/gems?saved=${encodeURIComponent(publish ? "Published" : "Saved as draft")}`);
}

export async function togglePublishAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "SUPPORT"]);
  const id = String(formData.get("id") ?? "");
  const g = await prisma.hiddenGem.findUnique({ where: { id } });
  if (!g) redirect("/admin/gems?error=Not+found");
  const status = g!.status === "APPROVED" ? "SUSPENDED" : "APPROVED";
  await prisma.hiddenGem.update({ where: { id }, data: { status, reviewedAt: new Date(), reviewedById: user.id } });
  revalidatePath("/gems");
  revalidatePath("/admin/gems");
  redirect(`/admin/gems?saved=${status === "APPROVED" ? "Published" : "Unpublished"}`);
}
