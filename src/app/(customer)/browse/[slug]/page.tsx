import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { ProductCard } from "@/components/product-card";
import { browseCategoryBySlug } from "@/lib/browse";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { getNearbyApprovedMerchants } from "@/lib/nearby";

export const dynamic = "force-dynamic";

export default async function BrowseCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const category = browseCategoryBySlug(slug);
  if (!category) notFound();

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

  const orderBy =
    sort === "price-asc"
      ? { priceCents: "asc" as const }
      : sort === "price-desc"
        ? { priceCents: "desc" as const }
        : sort === "name"
          ? { name: "asc" as const }
          : { sortOrder: "asc" as const };

  const products =
    nearby.merchantIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: {
            browseCategory: slug,
            isActive: true,
            merchantId: { in: nearby.merchantIds },
          },
          include: { merchant: true },
          orderBy,
        });

  return (
    <div className="min-h-full bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm font-medium text-[#0E3B24]/55">Shop</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-[#0E3B24]/65">{category.description}</p>
        <p className="mt-1 text-xs text-[#0E3B24]/50">
          Showing stores within {nearby.radiusKm} km · nearest first when you
          shop.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          {[
            { key: "default", label: "Featured" },
            { key: "price-asc", label: "Price ↑" },
            { key: "price-desc", label: "Price ↓" },
            { key: "name", label: "Name" },
          ].map((opt) => {
            const active = (sort ?? "default") === opt.key || (!sort && opt.key === "default");
            return (
              <Link
                key={opt.key}
                href={
                  opt.key === "default"
                    ? `/browse/${slug}`
                    : `/browse/${slug}?sort=${opt.key}`
                }
                className={`rounded-full px-3 py-1.5 font-medium ${
                  active
                    ? "bg-[#0E3B24] text-[#FFB627]"
                    : "bg-white text-[#0E3B24] border border-[#0E3B24]/10"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        {products.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-medium">No products in this category yet</p>
            <p className="mt-2 text-sm text-[#0E3B24]/65">
              Categories only show approved merchant catalogue items.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                initialQty={basketQtyByProduct[p.id] ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
