"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceCategoryCode } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { getLaunchZone } from "@/lib/zones";

function uniqueSlug(base: string) {
  return `${slugify(base) || "shop"}-${Date.now().toString(36).slice(-5)}`;
}

/** Reserve a shop slot in the backlog (DRAFT — not visible to customers yet). */
export async function createShopSlotAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "market").trim();
  const suburb = String(formData.get("suburb") ?? "").trim() || "Durban";
  const city = String(formData.get("city") ?? "").trim() || "Durban";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) redirect("/admin/shops?error=Shop+name+is+required");
  if (!["eats", "market", "both"].includes(kind)) {
    redirect("/admin/shops?error=Choose+menu%2C+stock%2C+or+both");
  }

  const zone = await getLaunchZone();
  const kindLabel =
    kind === "eats" ? "Food menu" : kind === "market" ? "Grocery stock" : "Menu + stock";

  const merchant = await prisma.merchant.create({
    data: {
      name,
      slug: uniqueSlug(name),
      description: notes
        ? `[BACKLOG · ${kindLabel}] ${notes}`
        : `[BACKLOG · ${kindLabel}] Reserved for catalogue upload.`,
      status: "DRAFT",
      isDevSample: false,
      suburb,
      city,
      zoneId: zone?.id,
    },
  });

  await writeAudit({
    actorId: user.id,
    entityType: "MERCHANT",
    entityId: merchant.id,
    action: "SHOP_BACKLOG_CREATED",
    detail: { name, kind },
  });

  revalidatePath("/admin/shops");
  redirect(`/admin/shops/${merchant.id}`);
}

/** Add a menu dish or stock line to a backlog shop. */
export async function addShopCatalogueItemAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const merchantId = String(formData.get("merchantId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const itemKind = String(formData.get("itemKind") ?? "stock").trim();
  const priceRand = Number(formData.get("priceRand") ?? 0);
  const stockRaw = String(formData.get("stockQty") ?? "").trim();
  const packageSize = String(formData.get("packageSize") ?? "").trim() || undefined;

  if (!merchantId || !name) {
    redirect(`/admin/shops/${merchantId || ""}?error=Name+required`);
  }
  if (!Number.isFinite(priceRand) || priceRand < 0) {
    redirect(`/admin/shops/${merchantId}?error=Invalid+price`);
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant || merchant.isDevSample) {
    redirect("/admin/shops?error=Shop+not+found+in+backlog");
  }

  const categoryCode =
    itemKind === "menu" ? ServiceCategoryCode.EATS : ServiceCategoryCode.MARKET;
  const category = await prisma.serviceCategory.findUnique({
    where: { code: categoryCode },
  });
  if (!category) {
    redirect(`/admin/shops/${merchantId}?error=Service+category+missing+—+reseed+DB`);
  }

  const browseCategory = itemKind === "menu" ? "food" : "groceries";
  const stockQty =
    stockRaw === "" ? null : Number.isFinite(Number(stockRaw)) ? Number(stockRaw) : null;

  const product = await prisma.product.create({
    data: {
      merchantId,
      categoryId: category.id,
      name,
      slug: uniqueSlug(name),
      description:
        itemKind === "menu"
          ? "Menu item — backlog (not live until shop is published)."
          : "Stock line — backlog (not live until shop is published).",
      packageSize,
      browseCategory,
      priceCents: Math.round(priceRand * 100),
      isAvailable: true,
      isActive: true,
      isDevSample: false,
      inventoryOwner: "MERCHANT",
      stockQty: itemKind === "stock" ? stockQty : null,
      allowsNotes: itemKind === "menu",
    },
  });

  await writeAudit({
    actorId: user.id,
    entityType: "PRODUCT",
    entityId: product.id,
    action: "SHOP_CATALOGUE_ITEM_ADDED",
    detail: { merchantId, itemKind, name },
  });

  revalidatePath(`/admin/shops/${merchantId}`);
  revalidatePath("/admin/shops");
  redirect(`/admin/shops/${merchantId}`);
}

/** Publish a backlog shop so customers can see it (when ready). */
export async function publishShopAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const merchantId = String(formData.get("merchantId") ?? "");
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { products: true },
  });
  if (!merchant || merchant.isDevSample) {
    redirect("/admin/shops?error=Shop+not+found");
  }
  if (merchant.products.length === 0) {
    redirect(
      `/admin/shops/${merchantId}?error=Add+at+least+one+menu+or+stock+item+before+publishing`,
    );
  }

  await prisma.merchant.update({
    where: { id: merchantId },
    data: { status: "APPROVED" },
  });

  await writeAudit({
    actorId: user.id,
    entityType: "MERCHANT",
    entityId: merchantId,
    action: "SHOP_PUBLISHED",
  });

  revalidatePath(`/admin/shops/${merchantId}`);
  revalidatePath("/admin/shops");
  revalidatePath("/");
  redirect(`/admin/shops/${merchantId}`);
}

/** Keep shop in backlog (unpublish from customer app). */
export async function unpublishShopAction(formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const merchantId = String(formData.get("merchantId") ?? "");
  await prisma.merchant.update({
    where: { id: merchantId },
    data: { status: "DRAFT" },
  });
  await writeAudit({
    actorId: user.id,
    entityType: "MERCHANT",
    entityId: merchantId,
    action: "SHOP_UNPUBLISHED",
  });
  revalidatePath(`/admin/shops/${merchantId}`);
  revalidatePath("/admin/shops");
  revalidatePath("/");
  redirect(`/admin/shops/${merchantId}`);
}
