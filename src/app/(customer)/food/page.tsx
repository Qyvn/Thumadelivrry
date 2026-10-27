import Link from "next/link";
import {
  ArrowRight,
  CupSoda,
  Heart,
  Home,
  ShoppingBasket,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { getCustomerShell } from "@/lib/customer-context";
import { BROWSE_CATEGORIES } from "@/lib/browse";
import { prisma } from "@/lib/db";
import { getNearbyApprovedMerchants } from "@/lib/nearby";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS = {
  cart: ShoppingBasket,
  utensils: UtensilsCrossed,
  cup: CupSoda,
  home: Home,
  heart: Heart,
  store: Store,
} as const;

export default async function FoodShopsPage() {
  const {
    user,
    basketCount,
    locationLabel,
    zone,
    basketQtyByProduct,
    origin,
    originSource,
    radiusKm,
  } = await getCustomerShell();

  const nearby = await getNearbyApprovedMerchants({
    zoneId: zone?.id,
    zoneBoundaryJson: zone?.boundaryJson,
    origin,
    radiusKm,
    originSource,
  });
  const nearbyIds = nearby.merchantIds;

  const approvedProducts =
    nearbyIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: {
            isActive: true,
            isAvailable: true,
            merchantId: { in: nearbyIds },
          },
          include: { merchant: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          take: 12,
        });

  const categoryCounts = Object.fromEntries(
    BROWSE_CATEGORIES.map((c) => [
      c.slug,
      approvedProducts.filter((p) => p.browseCategory === c.slug).length,
    ]),
  );

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-8 sm:max-w-xl">
        <p className="text-sm text-[var(--muted)]">Delivery powered by THUMA</p>
        <h1 className="display mt-2 text-4xl text-[var(--ink)]">Food</h1>
        <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
          Groceries and meals from approved shops.
        </p>
        <div className="mt-5">
          <Link href="/merchant/apply" className="inline-flex h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]">
            List your shop
          </Link>
        </div>

        <form action="/search" className="mt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3">
            <input
              name="q"
              placeholder="Search food & shops"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            />
          </div>
        </form>

        <section className="mt-8">
          <h2 className="display text-2xl">Categories</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {BROWSE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon];
              const count = categoryCounts[cat.slug] ?? 0;
              const disabled = cat.slug === "local" ? nearby.merchants.length === 0 : count === 0;
              return (
                <Link
                  key={cat.slug}
                  href={disabled ? "#" : `/browse/${cat.slug}`}
                  aria-disabled={disabled}
                  className={`rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 ${
                    disabled ? "pointer-events-none opacity-45" : "hover:border-[var(--ink)]"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB627] text-[#0E3B24]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold">{cat.name}</span>
                  <span className="mt-1 block text-xs text-[#0E3B24]/55">
                    {disabled ? "Coming when available" : cat.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Popular nearby</h2>
            <Link href="/browse/groceries" className="text-sm font-semibold underline inline-flex items-center gap-1">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {approvedProducts.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-[var(--card)]/70 px-5 py-10 text-center text-sm text-[var(--muted)]">
              No products available in your Durban area yet.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {approvedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  initialQty={basketQtyByProduct[p.id] ?? 0}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
