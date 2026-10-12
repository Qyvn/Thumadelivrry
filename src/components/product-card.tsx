"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { addToBasketQuietAction } from "@/app/actions/basket";
import { formatZar } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  packageSize?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  stockQty?: number | null;
  merchant: { name: string; slug: string };
};

export function ProductCard({
  product,
  initialQty = 0,
}: {
  product: ProductCardData;
  initialQty?: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(initialQty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function adjust(delta: number) {
    if (!product.isAvailable) return;
    setError(null);
    startTransition(async () => {
      const next = Math.max(0, qty + delta);
      const result = await addToBasketQuietAction({
        productId: product.id,
        quantityDelta: delta,
        absoluteQuantity: delta < 0 && next === 0 ? 0 : undefined,
      });
      if (!result.ok) {
        if (result.needsAuth) {
          router.push("/login");
          return;
        }
        setError(result.error);
        return;
      }
      setQty(result.quantity);
      router.refresh();
    });
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#18221B]/8 bg-white shadow-[0_1px_2px_rgba(24,34,27,0.04)]">
      <Link href={`/products/${product.id}`} className="relative aspect-square bg-[#ebe4d4]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        ) : null}
        {!product.isAvailable && (
          <span className="absolute inset-x-2 bottom-2 rounded-lg bg-[#18221B]/85 px-2 py-1 text-center text-[11px] font-semibold text-white">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${product.id}`} className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#18221B]">
            {product.name}
          </h3>
          {product.packageSize && (
            <p className="mt-0.5 text-xs text-[#18221B]/55">{product.packageSize}</p>
          )}
        </Link>
        <p className="mt-2 text-sm font-bold text-[#18221B]">
          {formatZar(product.priceCents)}
        </p>
        <Link
          href={`/shops/${product.merchant.slug}`}
          className="mt-1 truncate text-xs text-[#18221B]/55 hover:underline"
        >
          {product.merchant.name}
        </Link>
        {typeof product.stockQty === "number" && product.isAvailable && (
          <p className="mt-1 text-[11px] text-[#18221B]/45">
            {product.stockQty > 0 ? `${product.stockQty} in stock` : "Limited stock"}
          </p>
        )}

        <div className="mt-auto pt-3">
          {qty === 0 ? (
            <button
              type="button"
              disabled={!product.isAvailable || pending}
              onClick={() => adjust(1)}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-[#D0F27B] text-sm font-bold text-[#18221B] transition hover:bg-[#c3e86a] disabled:opacity-50"
            >
              Add
            </button>
          ) : (
            <div className="flex h-10 items-center justify-between rounded-xl border border-[#18221B]/12 bg-[#F5F0E6] px-1">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={pending}
                onClick={() => adjust(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#18221B] hover:bg-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-6 text-center text-sm font-bold">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={pending}
                onClick={() => adjust(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#18221B] hover:bg-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
          {error && (
            <p className="mt-2 text-[11px] leading-snug text-red-700">{error}</p>
          )}
        </div>
      </div>
    </article>
  );
}
