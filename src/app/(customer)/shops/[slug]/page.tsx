import Image from "next/image";
import { notFound } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { ProductCard } from "@/components/product-card";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { browseCategoryBySlug } from "@/lib/browse";
import { distanceKm, formatDistanceKm, parseZoneGeo } from "@/lib/geo";

export const dynamic = "force-dynamic";

function isOpenNow(hoursJson: string | null | undefined): boolean | null {
  if (!hoursJson) return null;
  try {
    const hours = JSON.parse(hoursJson) as Record<
      string,
      { open: string; close: string }
    >;
    const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const day = keys[new Date().getDay()];
    const slot = hours[day];
    if (!slot) return null;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = slot.open.split(":").map(Number);
    const [ch, cm] = slot.close.split(":").map(Number);
    return mins >= oh * 60 + om && mins <= ch * 60 + cm;
  } catch {
    return null;
  }
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ aisle?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { aisle, q } = await searchParams;
  const {
    user,
    basketCount,
    locationLabel,
    basketQtyByProduct,
    origin,
    radiusKm,
    zone,
  } = await getCustomerShell();

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    include: {
      products: {
        where: {
          isActive: true,
          ...(aisle ? { browseCategory: aisle } : {}),
          ...(q && q.trim().length >= 2
            ? {
                OR: [
                  { name: { contains: q.trim() } },
                  { description: { contains: q.trim() } },
                ],
              }
            : {}),
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!merchant || merchant.status !== "APPROVED") notFound();

  const open = isOpenNow(merchant.hoursJson);
  const zoneGeo = parseZoneGeo(zone?.boundaryJson);
  const effectiveRadius = radiusKm ?? zoneGeo.radiusKm ?? 3;
  const storeDistance =
    merchant.latitude != null && merchant.longitude != null
      ? distanceKm(origin, {
          lat: merchant.latitude,
          lng: merchant.longitude,
        })
      : null;
  const withinRadius =
    storeDistance != null ? storeDistance <= effectiveRadius : false;
  const aisles = Array.from(
    new Set(
      (
        await prisma.product.findMany({
          where: { merchantId: merchant.id, isActive: true },
          select: { browseCategory: true },
        })
      ).map((p) => p.browseCategory),
    ),
  );

  return (
    <div className="min-h-full bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="relative mb-6 h-44 overflow-hidden rounded-2xl bg-[#0E3B24] sm:h-56">
          {merchant.imageUrl && (
            <Image
              src={merchant.imageUrl}
              alt={merchant.name}
              fill
              className="object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B24] to-transparent" />
          <div className="absolute bottom-0 p-5 text-white">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              {merchant.name}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/75">
              {merchant.description}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#FFB627]">
              {open === null
                ? "Hours not configured"
                : open
                  ? "Open now"
                  : "Closed"}
              {merchant.isDevSample ? " · Development sample" : ""}
            </p>
          </div>
        </div>

        <p className="text-sm text-[#0E3B24]/65">
          Single-merchant baskets only — add from this shop, then checkout.
          Merchant pickup location is separate from your Durban delivery
          address.
        </p>
        {storeDistance != null && (
          <p
            className={`mt-2 text-sm font-semibold ${
              withinRadius ? "text-emerald-800" : "text-red-700"
            }`}
          >
            {formatDistanceKm(storeDistance)} from your delivery pin ·{" "}
            {withinRadius
              ? `inside ${effectiveRadius} km radius`
              : `outside ${effectiveRadius} km radius — ordering blocked`}
          </p>
        )}

        <form className="mt-4">
          <input type="hidden" name="aisle" value={aisle ?? ""} />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search this store"
            className="h-11 w-full rounded-xl border border-[#0E3B24]/15 bg-white px-4 text-sm"
          />
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/shops/${merchant.slug}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              !aisle ? "bg-[#0E3B24] text-[#FFB627]" : "bg-white border border-[#0E3B24]/10"
            }`}
          >
            All
          </a>
          {aisles.map((a) => {
            const meta = browseCategoryBySlug(a);
            return (
              <a
                key={a}
                href={`/shops/${merchant.slug}?aisle=${a}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  aisle === a
                    ? "bg-[#0E3B24] text-[#FFB627]"
                    : "bg-white border border-[#0E3B24]/10"
                }`}
              >
                {meta?.name ?? a}
              </a>
            );
          })}
        </div>

        {merchant.products.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-medium">No matching products in this store</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {merchant.products.map((product) => (
              <ProductCard
                key={product.id}
                product={{ ...product, merchant }}
                initialQty={basketQtyByProduct[product.id] ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
