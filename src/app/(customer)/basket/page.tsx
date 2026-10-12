import Link from "next/link";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { Button } from "@/components/ui/button";
import {
  clearBasketAction,
  updateBasketItemAction,
} from "@/app/actions/basket";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { getOrCreateBasket, summariseBasket } from "@/lib/orders";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BasketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { user, basketCount, locationLabel, customerId, zone } =
    await getCustomerShell();

  if (!user || !customerId) {
    return (
      <div className="min-h-full">
        <DevBanner />
        <CustomerNav
          user={user}
          basketCount={0}
          locationLabel={locationLabel}
        />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Your basket
          </h1>
          <p className="mt-3 text-[#18221B]/65">
            Sign in to add items and place an order.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#D0F27B] px-5 text-sm font-bold text-[#18221B]"
          >
            Log in
          </Link>
        </main>
      </div>
    );
  }

  const basket = await getOrCreateBasket(customerId);
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  const deliveryFee = zone?.baseFeeCents ?? settings?.defaultDeliveryFeeCents ?? 2500;
  const serviceFee = settings?.serviceFeeCents ?? 500;
  const totals = summariseBasket(basket.items, deliveryFee, serviceFee);

  return (
    <div className="min-h-full">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Basket
          </h1>
          {basket.items.length > 0 && (
            <form action={clearBasketAction}>
              <Button type="submit" variant="ghost" size="sm">
                Clear
              </Button>
            </form>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {basket.items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#18221B]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-medium">Your basket is empty</p>
            <Link
              href="/eats"
              className="mt-4 inline-block text-sm font-semibold underline"
            >
              Browse THUMA Eats
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {basket.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-[#18221B]/8 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-[#18221B]/55">
                        {item.product.merchant.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatZar(item.unitPriceCents * item.quantity)}
                      </p>
                    </div>
                    <form
                      action={updateBasketItemAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <Button
                        type="submit"
                        name="quantity"
                        value={String(item.quantity - 1)}
                        variant="outline"
                        size="icon"
                        aria-label="Decrease"
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        type="submit"
                        name="quantity"
                        value={String(item.quantity + 1)}
                        variant="outline"
                        size="icon"
                        aria-label="Increase"
                      >
                        +
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2 rounded-2xl bg-white p-5 text-sm">
              <Row label="Items" value={formatZar(totals.itemTotalCents)} />
              <Row
                label="Delivery fee"
                value={formatZar(totals.deliveryFeeCents)}
              />
              <Row
                label="Service fee"
                value={formatZar(totals.serviceFeeCents)}
              />
              <div className="border-t border-[#18221B]/10 pt-3">
                <Row
                  label="Total"
                  value={formatZar(totals.totalCents)}
                  strong
                />
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#D0F27B] text-sm font-bold text-[#18221B]"
            >
              Go to checkout
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? "text-base font-bold" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
