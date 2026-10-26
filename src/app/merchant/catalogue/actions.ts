"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { importProducts, merchantForUser, saveProduct } from "@/lib/merchant-onboarding";
import { imageToDataUrl, parseProductCsv, productSchema, randToCents } from "@/lib/onboarding";
import { normalisePricingCategory } from "@/lib/pricing";

async function currentMerchant(formData: FormData) {
  const user = await requireUser(["MERCHANT_STAFF", "ADMIN"]);
  const merchant = await merchantForUser(user, String(formData.get("merchantId") ?? "") || null);
  if (!merchant) redirect("/merchant?error=No+merchant+linked+to+your+account");
  if (merchant.status !== "APPROVED") redirect("/merchant/catalogue?error=Merchant+is+not+approved");
  return { user, merchant };
}

function back(merchantId: string, user: { role: string }, q: string): never {
  const m = user.role === "ADMIN" ? `merchantId=${merchantId}&` : "";
  redirect(`/merchant/catalogue?${m}${q}`);
}

export async function saveProductAction(formData: FormData) {
  const { user, merchant } = await currentMerchant(formData);
  try {
    const parsed = productSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      priceCents: randToCents(String(formData.get("price") ?? "")),
      description: String(formData.get("description") ?? "").trim() || undefined,
      isAvailable: formData.get("isAvailable") === "on",
      browseCategory: String(formData.get("browseCategory") ?? ""),
    });
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
    let imageUrl: string | null | undefined;
    const img = formData.get("image");
    if (img instanceof File && img.size > 0) imageUrl = imageToDataUrl(img, Buffer.from(await img.arrayBuffer()));
    else if (formData.get("removeImage") === "on") imageUrl = null;
    await saveProduct({
      merchant,
      productId: String(formData.get("productId") ?? "") || null,
      input: parsed.data,
      imageUrl,
      actorId: user.id,
    });
  } catch (e) {
    back(merchant.id, user, `error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/merchant/catalogue");
  revalidatePath(`/shops/${merchant.slug}`);
  back(merchant.id, user, "saved=Product+saved");
}

export async function importCsvAction(formData: FormData) {
  const { user, merchant } = await currentMerchant(formData);
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) back(merchant.id, user, "error=Choose+a+CSV+file");
  if (file.size > 1024 * 1024) back(merchant.id, user, "error=CSV+must+be+under+1+MB");
  const { products, errors } = parseProductCsv(await file.text(), normalisePricingCategory(merchant.pricingCategory));
  if (errors.length > 0) {
    // All-or-nothing: nothing is imported when any row is invalid
    back(merchant.id, user, `error=${encodeURIComponent(`Nothing imported. ${errors.slice(0, 5).join(" | ")}${errors.length > 5 ? ` (+${errors.length - 5} more)` : ""}`)}`);
  }
  const r = await importProducts({ merchant, products, actorId: user.id });
  revalidatePath("/merchant/catalogue");
  revalidatePath(`/shops/${merchant.slug}`);
  back(merchant.id, user, `saved=${encodeURIComponent(`Imported: ${r.created} new, ${r.updated} updated`)}`);
}
