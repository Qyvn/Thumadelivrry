"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  addToBasket,
  checkoutOrder,
  clearBasket,
  updateBasketItem,
} from "@/lib/orders";

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
      simulatePaymentSuccess: simulatePayment,
    });
    revalidatePath("/orders");
    redirect(`/orders/${order.id}`);
  } catch (e) {
    redirect(`/checkout?error=${encodeURIComponent((e as Error).message)}`);
  }
}
