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
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
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
    <div className="flex min-h-full flex-col bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav user={user} basketCount={basketCount} locationLabel={locationLabel} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0E3B24]/40">
          Delivery powered by THUMA
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
          Food &amp; Shops
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#0E3B24]/65">
          Groceries, meals and everyday essentials from approved merchants — ordered and delivered
          with THUMA.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/gems" className="inline-flex h-10 items-center rounded-full border border-[#0E3B24]/15 bg-white px-4 text-sm font-semibold">
            Hidden Gems
          </Link>
          <Link href="/homes" className="inline-flex h-10 items-center rounded-full border border-[#0E3B24]/15 bg-white px-4 text-sm font-semibold">
            Homes
          </Link>
          <Link href="/merchant/apply" className="inline-flex h-10 items-center rounded-full bg-[#FFB627] px-4 text-sm font-bold text-[#0E3B24]">
            Become a partner
          </Link>
        </div>

        <form action="/search" className="mt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[#0E3B24]/10 bg-white px-4 py-3">
            <input
              name="q"
              placeholder="Search groceries, meals and essentials"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#0E3B24]/40"
            />
          </div>
        </form>

        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Shop by category</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BROWSE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon];
              const count = categoryCounts[cat.slug] ?? 0;
              const disabled = cat.slug === "local" ? nearby.merchants.length === 0 : count === 0;
              return (
                <Link
                  key={cat.slug}
                  href={disabled ? "#" : `/browse/${cat.slug}`}
                  aria-disabled={disabled}
                  className={`rounded-2xl border border-[#0E3B24]/8 bg-white p-4 ${
                    disabled ? "pointer-events-none opacity-45" : "hover:border-[#0E3B24]/20"
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
            <div className="mt-4 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-10 text-center text-sm text-[#0E3B24]/65">
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
    </div>
  );
}
