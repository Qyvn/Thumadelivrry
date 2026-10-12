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
  const { user, basketCount, locationLabel, zone, basketQtyByProduct } =
    await getCustomerShell();

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

  const approvedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isAvailable: true,
      merchant: { status: "APPROVED", zoneId: zone?.id },
    },
    include: { merchant: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const popular = approvedProducts.slice(0, 8);
  const essentials = approvedProducts.filter((p) =>
    ["groceries", "household", "drinks", "personal-care"].includes(p.browseCategory),
  ).slice(0, 8);

  const merchants = await prisma.merchant.findMany({
    where: { status: "APPROVED", zoneId: zone?.id },
    orderBy: { name: "asc" },
  });

  // Categories with at least one available product (Local Shops only if merchants exist)
  const categoryCounts = Object.fromEntries(
    BROWSE_CATEGORIES.map((c) => [
      c.slug,
      approvedProducts.filter((p) => p.browseCategory === c.slug).length,
    ]),
  );

  const greeting = user
    ? `Hi ${user.fullName.split(" ")[0]}`
    : "Welcome to THUMA";

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
    <div className="flex min-h-full flex-col bg-[#F5F0E6]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5">
        <section className="animate-rise">
          <p className="text-sm font-medium text-[#18221B]/55">{greeting}</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#18221B] sm:text-4xl">
            What do you need today?
          </h1>
          <p className="mt-2 max-w-md text-sm text-[#18221B]/65">
            Your neighbourhood essentials, delivered.
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#18221B]/40">
            You need it. We bring it. · Cornubia Flats
          </p>
        </section>

        <form action="/search" className="mt-5 animate-fade">
          <label htmlFor="home-search" className="sr-only">
            Search
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-[#18221B]/10 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(24,34,27,0.04)]">
            <svg
              className="h-5 w-5 shrink-0 text-[#18221B]/45"
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
              className="w-full bg-transparent text-sm text-[#18221B] outline-none placeholder:text-[#18221B]/40"
            />
          </div>
        </form>

        {activeOrders[0] && (
          <Link
            href={`/orders/${activeOrders[0].id}`}
            className="mt-4 flex items-center justify-between rounded-2xl bg-[#18221B] px-4 py-3 text-sm text-white"
          >
            <span>
              Order {activeOrders[0].orderNumber} ·{" "}
              {activeOrders[0].status.replaceAll("_", " ").toLowerCase()}
            </span>
            <ArrowRight className="h-4 w-4 text-[#D0F27B]" />
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
                  className={`rounded-2xl border border-[#18221B]/8 bg-white p-4 transition ${
                    disabled
                      ? "pointer-events-none opacity-45"
                      : "hover:border-[#18221B]/20"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D0F27B] text-[#18221B]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold leading-snug">
                    {cat.name}
                  </span>
                  <span className="mt-1 block text-xs text-[#18221B]/55">
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
            <p className="mt-1 text-xs text-[#18221B]/55">
              Only verified, administrator-activated promotions appear here.
            </p>
            <div className="mt-3 space-y-3">
              {promotions.map((promo) => (
                <Link
                  key={promo.id}
                  href={promo.href || "/"}
                  className="block rounded-2xl bg-[#18221B] px-5 py-4 text-white"
                >
                  <p className="font-semibold text-[#D0F27B]">{promo.title}</p>
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
              <p className="mt-1 text-xs text-[#18221B]/55">
                From approved sample catalogue — not fabricated ratings.
              </p>
            </div>
            <Link href="/browse/groceries" className="text-sm font-semibold underline">
              See all
            </Link>
          </div>
          {popular.length === 0 ? (
            <EmptyBlock message="No products available in Cornubia Flats yet." />
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
          <p className="mt-1 text-xs text-[#18221B]/55">
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
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Nearby merchants
          </h2>
          <p className="mt-1 text-xs text-[#18221B]/55">
            Approved merchants only. Sample partners are labelled.
          </p>
          {merchants.length === 0 ? (
            <EmptyBlock message="No approved merchants in this zone yet." />
          ) : (
            <div className="mt-4 space-y-3">
              {merchants.map((m) => (
                <Link
                  key={m.id}
                  href={`/shops/${m.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#18221B]/8 bg-white p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#ebe4d4]">
                    {m.imageUrl && (
                      <Image src={m.imageUrl} alt={m.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{m.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[#18221B]/60">
                      {m.description}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#18221B]/40">
                      {m.isDevSample ? "Dev sample" : "Approved"} · {m.suburb}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#18221B]/8 bg-[#18221B] px-4 py-8 text-[#D0F27B]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">
              THUMA
            </p>
            <p className="text-sm text-[#D0F27B]/70">
              You need it. We bring it. · Cornubia Flats only for now
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
    <div className="mt-4 rounded-2xl border border-dashed border-[#18221B]/20 bg-white/70 px-5 py-10 text-center text-sm text-[#18221B]/65">
      {message}
    </div>
  );
}
