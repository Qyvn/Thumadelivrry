"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { addToBasketQuietAction } from "@/app/actions/basket";

export function QuantityAdd({
  productId,
  isAvailable,
  initialQty = 0,
}: {
  productId: string;
  isAvailable: boolean;
  initialQty?: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(initialQty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function adjust(delta: number) {
    if (!isAvailable) return;
    setError(null);
    startTransition(async () => {
      const next = Math.max(0, qty + delta);
      const result = await addToBasketQuietAction({
        productId,
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
    <div>
      {qty === 0 ? (
        <button
          type="button"
          disabled={!isAvailable || pending}
          onClick={() => adjust(1)}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#FFB627] text-sm font-bold text-[#0E3B24] hover:bg-[#c3e86a] disabled:opacity-50"
        >
          Add to basket
        </button>
      ) : (
        <div className="flex h-12 items-center justify-between rounded-xl border border-[#0E3B24]/12 bg-[#F7F3EA] px-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={pending}
            onClick={() => adjust(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-base font-bold">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={pending}
            onClick={() => adjust(1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
