"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  addToBasket,
  checkoutOrder,
  clearBasket,
  getOrCreateBasket,
  updateBasketItem,
} from "@/lib/orders";

export type QuietBasketResult =
  | { ok: true; quantity: number }
  | { ok: false; error: string; needsAuth?: boolean };

export async function addToBasketQuietAction(params: {
  productId: string;
  quantityDelta: number;
  absoluteQuantity?: number;
}): Promise<QuietBasketResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to shop", needsAuth: true };

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { ok: false, error: "Sign in to shop", needsAuth: true };

  try {
    const basket = await getOrCreateBasket(profile.id);
    const existing = basket.items.find((i) => i.productId === params.productId);

    if (params.absoluteQuantity === 0 && existing) {
      await updateBasketItem(profile.id, existing.id, 0);
      revalidatePath("/");
      revalidatePath("/basket");
      return { ok: true, quantity: 0 };
    }

    if (params.quantityDelta > 0) {
      const updated = await addToBasket({
        customerId: profile.id,
        productId: params.productId,
        quantity: params.quantityDelta,
      });
      const item = updated.items.find((i) => i.productId === params.productId);
      revalidatePath("/");
      revalidatePath("/basket");
      return { ok: true, quantity: item?.quantity ?? 0 };
    }

    if (params.quantityDelta < 0 && existing) {
      const next = existing.quantity + params.quantityDelta;
      await updateBasketItem(profile.id, existing.id, next);
      revalidatePath("/");
      revalidatePath("/basket");
      return { ok: true, quantity: Math.max(0, next) };
    }

    return { ok: true, quantity: existing?.quantity ?? 0 };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addToBasketAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/login");

  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const notes = String(formData.get("notes") ?? "") || undefined;

  try {
    await addToBasket({
      customerId: profile.id,
      productId,
      quantity: Number.isFinite(quantity) ? Math.max(1, quantity) : 1,
      notes,
    });
  } catch (e) {
    redirect(`/basket?error=${encodeURIComponent((e as Error).message)}`);
  }

  revalidatePath("/");
  revalidatePath("/basket");
  redirect("/basket");
}

export async function updateBasketItemAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/login");

  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  await updateBasketItem(profile.id, itemId, quantity);
  revalidatePath("/basket");
  revalidatePath("/");
}

export async function clearBasketAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/login");
  await clearBasket(profile.id);
  revalidatePath("/basket");
  revalidatePath("/");
}

export async function checkoutAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/login");

  const addressId = String(formData.get("addressId") ?? "");
  const customerNotes = String(formData.get("customerNotes") ?? "") || undefined;
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  const simulatePayment = formData.get("simulatePayment") === "success";
  const tipRand = Number(formData.get("tipRand") ?? 0);
  const tipCents =
    Number.isFinite(tipRand) && tipRand > 0 ? Math.min(20000, Math.round(tipRand * 100)) : 0;

  if (!addressId || !idempotencyKey) {
    redirect("/checkout?error=Missing+checkout+details");
  }

  try {
    const order = await checkoutOrder({
      customerId: profile.id,
      userId: user.id,
      addressId,
      customerNotes,
      idempotencyKey,
      tipCents,
      simulatePaymentSuccess: simulatePayment,
    });
    revalidatePath("/orders");
    redirect(`/orders/${order.id}`);
  } catch (e) {
    redirect(`/checkout?error=${encodeURIComponent((e as Error).message)}`);
  }
}
