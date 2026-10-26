import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Heart,
  Home,
  ShoppingBasket,
  Store,
  CupSoda,
  UtensilsCrossed,
} from "lucide-react";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { ProductCard } from "@/components/product-card";
import { getCustomerShell } from "@/lib/customer-context";
import { BROWSE_CATEGORIES } from "@/lib/browse";
import { prisma } from "@/lib/db";
import { getNearbyApprovedMerchants } from "@/lib/nearby";
import { statusLabel } from "@/lib/order-lifecycle";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS = {
  cart: ShoppingBasket,
  utensils: UtensilsCrossed,
  cup: CupSoda,
  home: Home,
  heart: Heart,
  store: Store,
} as const;

export default async function HomePage() {
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

  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });

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
        });

  // Prefer products from the nearest store first
  const nearestId = nearbyIds[0];
  const sortedProducts = [...approvedProducts].sort((a, b) => {
    if (a.merchantId === nearestId && b.merchantId !== nearestId) return -1;
    if (b.merchantId === nearestId && a.merchantId !== nearestId) return 1;
    return 0;
  });

  const popular = sortedProducts.slice(0, 8);
  const essentials = sortedProducts
    .filter((p) =>
      ["groceries", "household", "drinks", "personal-care"].includes(
        p.browseCategory,
      ),
    )
    .slice(0, 8);

  const merchants = nearby.merchants;

  // Categories with at least one available product (Local Shops only if merchants exist)
  const categoryCounts = Object.fromEntries(
    BROWSE_CATEGORIES.map((c) => [
      c.slug,
      approvedProducts.filter((p) => p.browseCategory === c.slug).length,
    ]),
  );

  const greeting = user
    ? `Hi ${user.fullName.split(" ")[0]}`
    : "Welcome to Duban";

  const activeOrders =
    user?.role === "CUSTOMER"
      ? await prisma.order.findMany({
          where: {
            customer: { userId: user.id },
            status: {
              notIn: ["DELIVERED", "CANCELLED", "REFUNDED", "PAYMENT_FAILED"],
            },
          },
          take: 1,
          orderBy: { placedAt: "desc" },
        })
      : [];

  return (
    <div className="flex min-h-full flex-col bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5">
        <section className="animate-rise">
          <p className="text-sm font-medium text-[#0E3B24]/55">{greeting}</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0E3B24] sm:text-4xl">
            What do you need today?
          </h1>
          <p className="mt-2 max-w-md text-sm text-[#0E3B24]/65">
            Your neighbourhood essentials, delivered.
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#0E3B24]/40">
            Love Durban, Hidden Gems · powered by THUMA
          </p>
        </section>

        <form action="/search" className="mt-5 animate-fade">
          <label htmlFor="home-search" className="sr-only">
            Search
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-[#0E3B24]/10 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(14,59,36,0.04)]">
            <svg
              className="h-5 w-5 shrink-0 text-[#0E3B24]/45"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="home-search"
              name="q"
              placeholder="Search groceries, meals and essentials"
              className="w-full bg-transparent text-sm text-[#0E3B24] outline-none placeholder:text-[#0E3B24]/40"
            />
          </div>
        </form>

        {activeOrders[0] && (
          <Link
            href={`/orders/${activeOrders[0].id}`}
            className="mt-4 flex items-center justify-between rounded-2xl bg-[#0E3B24] px-4 py-3 text-sm text-white"
          >
            <span>
              Order {activeOrders[0].orderNumber} ·{" "}
              {statusLabel(activeOrders[0].status)}
            </span>
            <ArrowRight className="h-4 w-4 text-[#FFB627]" />
          </Link>
        )}

        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Shop by category
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BROWSE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon];
              const count = categoryCounts[cat.slug] ?? 0;
              const disabled = cat.slug === "local" ? merchants.length === 0 : count === 0;
              return (
                <Link
                  key={cat.slug}
                  href={disabled ? "#" : `/browse/${cat.slug}`}
                  aria-disabled={disabled}
                  className={`rounded-2xl border border-[#0E3B24]/8 bg-white p-4 transition ${
                    disabled
                      ? "pointer-events-none opacity-45"
                      : "hover:border-[#0E3B24]/20"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB627] text-[#0E3B24]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold leading-snug">
                    {cat.name}
                  </span>
                  <span className="mt-1 block text-xs text-[#0E3B24]/55">
                    {disabled ? "Coming when available" : cat.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {promotions.length > 0 && (
          <section className="mt-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Offers
            </h2>
            <p className="mt-1 text-xs text-[#0E3B24]/55">
              Only verified, administrator-activated promotions appear here.
            </p>
            <div className="mt-3 space-y-3">
              {promotions.map((promo) => (
                <Link
                  key={promo.id}
                  href={promo.href || "/"}
                  className="block rounded-2xl bg-[#0E3B24] px-5 py-4 text-white"
                >
                  <p className="font-semibold text-[#FFB627]">{promo.title}</p>
                  {promo.body && (
                    <p className="mt-1 text-sm text-white/75">{promo.body}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Popular products
              </h2>
              <p className="mt-1 text-xs text-[#0E3B24]/55">
                From approved sample catalogue — not fabricated ratings.
              </p>
            </div>
            <Link href="/browse/groceries" className="text-sm font-semibold underline">
              See all
            </Link>
          </div>
          {popular.length === 0 ? (
            <EmptyBlock message="No products available in your Durban area yet." />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {popular.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  initialQty={basketQtyByProduct[p.id] ?? 0}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Everyday essentials
          </h2>
          <p className="mt-1 text-xs text-[#0E3B24]/55">
            Groceries, drinks, household and personal care.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {essentials.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                initialQty={basketQtyByProduct[p.id] ?? 0}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Nearest stores
              </h2>
              <p className="mt-1 text-xs text-[#0E3B24]/55">
                Within {nearby.radiusKm} km of{" "}
                {nearby.originSource === "address"
                  ? "your delivery address"
                  : "the Durban zone centre"}
                . Closest first.
              </p>
            </div>
          </div>
          {merchants.length === 0 ? (
            <EmptyBlock message="No approved stores within the delivery radius." />
          ) : (
            <div className="mt-4 space-y-3">
              {merchants.map((m, index) => (
                <Link
                  key={m.id}
                  href={`/shops/${m.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#0E3B24]/8 bg-white p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#efe6d2]">
                    {m.imageUrl && (
                      <Image
                        src={m.imageUrl}
                        alt={m.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{m.name}</p>
                      <span className="shrink-0 rounded-full bg-[#FFB627] px-2 py-0.5 text-[11px] font-bold text-[#0E3B24]">
                        {index === 0 ? "Nearest · " : ""}
                        {m.distanceLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[#0E3B24]/60">
                      {m.description}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#0E3B24]/40">
                      {m.isDevSample ? "Dev sample" : "Approved"} · {m.suburb}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#0E3B24]/8 bg-[#0E3B24] px-4 py-8 text-[#FFB627]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">
              Duban
            </p>
            <p className="text-sm text-[#FFB627]/70">
              Love Durban, Hidden Gems · Delivery powered by THUMA · WhatsApp +27 64 552 7661
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/merchant" className="hover:underline">
              Merchant
            </Link>
            <Link href="/courier" className="hover:underline">
              Courier
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-10 text-center text-sm text-[#0E3B24]/65">
      {message}
    </div>
  );
}
