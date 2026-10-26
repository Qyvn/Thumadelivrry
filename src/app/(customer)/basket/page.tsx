import Image from "next/image";
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
import { FeeBreakdown } from "@/components/fee-breakdown";
import { getOrCreateBasket } from "@/lib/orders";
import { quoteForBasket } from "@/lib/pricing-server";
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
      <div className="min-h-full bg-[#F7F3EA]">
        <DevBanner />
        <CustomerNav user={user} basketCount={0} locationLabel={locationLabel} />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Your basket
          </h1>
          <p className="mt-3 text-[#0E3B24]/65">
            Sign in to add items and place an order.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#FFB627] px-5 text-sm font-bold text-[#0E3B24]"
          >
            Log in
          </Link>
        </main>
      </div>
    );
  }

  const basket = await getOrCreateBasket(customerId);
  const firstMerchantId = basket.items[0]?.product.merchantId;
  const merchant = firstMerchantId
    ? await prisma.merchant.findUnique({
        where: { id: firstMerchantId },
        include: { zone: true },
      })
    : null;
  const defaultAddress = await prisma.address.findFirst({
    where: { customerId, isDefault: true },
  });
  const itemTotalCents = basket.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPriceCents,
    0,
  );
  const { quote: totals, config, hasPlus } = await quoteForBasket({
    customerId,
    itemTotalCents,
    merchant,
    address: defaultAddress,
    zoneBoundaryJson: zone?.boundaryJson,
  });
  const minOrderCents = totals.minOrderCents;
  const minimum = { ok: totals.meetsMinimum, shortfallCents: totals.shortfallCents };
  const merchantName = basket.items[0]?.product.merchant.name;

  return (
    <div className="min-h-full bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Basket
            </h1>
            {merchantName && (
              <p className="mt-1 text-sm text-[#0E3B24]/60">
                From {merchantName} · single-merchant order
              </p>
            )}
          </div>
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
          <div className="mt-10 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-medium">Your basket is empty</p>
            <Link
              href="/browse/groceries"
              className="mt-4 inline-block text-sm font-semibold underline"
            >
              Browse groceries
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {basket.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-[#0E3B24]/8 bg-white p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#efe6d2]">
                    {item.product.imageUrl && (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    {item.product.packageSize && (
                      <p className="text-xs text-[#0E3B24]/50">
                        {item.product.packageSize}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold">
                      {formatZar(item.unitPriceCents)} each ·{" "}
                      {formatZar(item.unitPriceCents * item.quantity)}
                    </p>
                    <form
                      action={updateBasketItemAction}
                      className="mt-2 flex items-center gap-2"
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

            <div className="mt-6">
              <FeeBreakdown {...totals} />
              <p className="mt-2 text-xs text-[#0E3B24]/55">
                Delivery is priced by distance ({formatZar(config.deliveryBand1Cents)} up to{" "}
                {config.deliveryBand1MaxKm} km, capped at {formatZar(config.deliveryFeeCapCents)}).
                Service fee waived over {formatZar(config.serviceFeeWaiverOverCents)}; small-order
                fee applies under {formatZar(config.smallOrderUnderCents)}.
                {!hasPlus && config.plusEnabled && (
                  <>
                    {" "}
                    <Link href="/account" className="font-semibold underline">
                      THUMA Plus
                    </Link>{" "}
                    removes the service fee and gives free delivery up to{" "}
                    {config.plusFreeDeliveryMaxKm} km on qualifying orders.
                  </>
                )}
              </p>
            </div>

            {!minimum.ok ? (
              <div className="mt-4 rounded-2xl border border-[#0E3B24]/10 bg-[#efe6d2]/60 px-4 py-3 text-sm">
                <p className="font-semibold text-[#0E3B24]">
                  Minimum order {formatZar(minOrderCents)}
                </p>
                <p className="mt-1 text-[#0E3B24]/70">
                  We do not deliver under {formatZar(minOrderCents)}. Add{" "}
                  {formatZar(minimum.shortfallCents)} more in items to continue.
                </p>
                <Link
                  href="/browse/groceries"
                  className="mt-3 inline-flex h-11 items-center rounded-xl bg-[#0E3B24] px-4 text-sm font-bold text-[#FFB627]"
                >
                  Add more items
                </Link>
              </div>
            ) : (
              <Link
                href="/checkout"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#FFB627] text-sm font-bold text-[#0E3B24]"
              >
                Go to checkout
              </Link>
            )}
          </>
        )}
      </main>
    </div>
  );
}
