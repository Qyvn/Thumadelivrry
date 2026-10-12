import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, ShoppingBasket, UtensilsCrossed } from "lucide-react";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, basketCount, locationLabel, zone } = await getCustomerShell();

  const categories = await prisma.serviceCategory.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" },
  });

  const merchants = await prisma.merchant.findMany({
    where: { status: "APPROVED", zoneId: zone?.id },
    include: {
      products: {
        where: { isActive: true, isAvailable: true },
        take: 3,
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

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
    <div className="flex min-h-full flex-col">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />

      <main className="flex-1">
        <section className="thuma-hero-bg thuma-grain relative overflow-hidden">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-14 pt-10 md:grid-cols-[1.1fr_0.9fr] md:items-end md:pb-16 md:pt-14">
            <div className="animate-rise space-y-5">
              <p className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-[#18221B] sm:text-6xl md:text-7xl">
                THUMA
              </p>
              <h1 className="max-w-md text-2xl font-semibold leading-snug text-[#18221B] sm:text-3xl">
                You need it. We bring it.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-[#18221B]/70">
                Everything-delivery for Cornubia Flats — food, groceries, and
                everyday essentials from local merchants, when the zone is live.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/eats"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#D0F27B] px-5 text-sm font-bold text-[#18221B] transition hover:bg-[#c3e86a]"
                >
                  Browse food
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/market"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#18221B] px-5 text-sm font-bold text-[#D0F27B] transition hover:bg-[#243029]"
                >
                  Browse essentials
                </Link>
              </div>
            </div>

            <div className="animate-fade relative min-h-[220px] overflow-hidden rounded-none md:min-h-[320px]">
              <div className="absolute inset-0 bg-[#18221B]">
                <Image
                  src="/images/hero-cornubia.svg"
                  alt="Cornubia Flats evening streetscape illustration for THUMA delivery"
                  fill
                  className="object-cover opacity-95"
                  priority
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#18221B] via-[#18221B]/40 to-transparent p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#D0F27B]/80">
                  Launch zone
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                  Cornubia Flats, KZN
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/addresses"
              className="inline-flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#18221B]/10 bg-white px-4 text-sm font-medium text-[#18221B] sm:flex-none"
            >
              Confirm location
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#18221B]/10 bg-white px-4 text-sm font-medium text-[#18221B] sm:flex-none"
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
            <Link
              href="/basket"
              className="inline-flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#18221B]/10 bg-white px-4 text-sm font-medium text-[#18221B] sm:flex-none"
            >
              <ShoppingBasket className="h-4 w-4" />
              Basket
            </Link>
            <Link
              href="/orders"
              className="inline-flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#18221B]/10 bg-white px-4 text-sm font-medium text-[#18221B] sm:flex-none"
            >
              Active orders
            </Link>
          </div>

          {activeOrders[0] && (
            <Link
              href={`/orders/${activeOrders[0].id}`}
              className="mt-4 flex items-center justify-between rounded-xl bg-[#18221B] px-4 py-3 text-sm text-white animate-pulse-soft"
            >
              <span>
                Order {activeOrders[0].orderNumber} ·{" "}
                {activeOrders[0].status.replaceAll("_", " ").toLowerCase()}
              </span>
              <ArrowRight className="h-4 w-4 text-[#D0F27B]" />
            </Link>
          )}
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                Services
              </h2>
              <p className="mt-1 text-sm text-[#18221B]/65">
                Food and essentials first. Local and Express come later.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((cat) => {
              const href =
                cat.code === "EATS"
                  ? "/eats"
                  : cat.code === "MARKET"
                    ? "/market"
                    : "#";
              const Icon =
                cat.code === "EATS" ? UtensilsCrossed : ShoppingBasket;
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className="group flex items-start gap-4 rounded-2xl border border-[#18221B]/8 bg-white p-5 transition hover:border-[#18221B]/20"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D0F27B] text-[#18221B]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{cat.name}</span>
                    <span className="mt-1 block text-sm text-[#18221B]/65">
                      {cat.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="mb-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Nearby (sample catalogue)
            </h2>
            <p className="mt-1 text-sm text-[#18221B]/65">
              Development sample merchants only — not confirmed live partners.
            </p>
          </div>

          {merchants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#18221B]/20 bg-white/60 px-5 py-10 text-center">
              <p className="font-semibold">No approved merchants yet</p>
              <p className="mt-2 text-sm text-[#18221B]/65">
                Administrators must approve merchants before they appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {merchants.map((merchant) => (
                <div
                  key={merchant.id}
                  className="overflow-hidden rounded-2xl border border-[#18221B]/8 bg-white"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[#18221B]/6 px-5 py-4">
                    <div>
                      <h3 className="font-semibold">{merchant.name}</h3>
                      <p className="text-sm text-[#18221B]/60">
                        {merchant.suburb}
                        {merchant.isDevSample ? " · DEV SAMPLE" : ""}
                      </p>
                    </div>
                    <Link
                      href={`/shops/${merchant.slug}`}
                      className="text-sm font-semibold text-[#18221B] underline-offset-4 hover:underline"
                    >
                      View shop
                    </Link>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-3">
                    {merchant.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/shops/${merchant.slug}`}
                        className="flex gap-3 rounded-xl p-2 hover:bg-[#F5F0E6]"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#ebe4d4]">
                          {product.imageUrl && (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {formatZar(product.priceCents)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
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
              You need it. We bring it. · Cornubia Flats
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/merchant" className="hover:underline">
              Merchant portal
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
