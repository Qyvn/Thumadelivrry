import Link from "next/link";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { BROWSE_CATEGORIES } from "@/lib/browse";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const { user, basketCount, locationLabel, zone, basketQtyByProduct } =
    await getCustomerShell();

  const products =
    query.length >= 2
      ? await prisma.product.findMany({
          where: {
            isActive: true,
            merchant: { status: "APPROVED", zoneId: zone?.id },
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { browseCategory: { contains: query.toLowerCase() } },
              { merchant: { name: { contains: query } } },
            ],
          },
          include: { merchant: true },
          take: 40,
        })
      : [];

  const suggestions = BROWSE_CATEGORIES.slice(0, 4);

  return (
    <div className="min-h-full bg-[#F5F0E6]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Search
        </h1>
        <form className="mt-4">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search groceries, meals and essentials"
            aria-label="Search"
            autoFocus
          />
        </form>

        {query.length === 0 && (
          <div className="mt-8">
            <p className="text-sm font-semibold">Try a category</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Link
                  key={s.slug}
                  href={`/browse/${s.slug}`}
                  className="rounded-full border border-[#18221B]/10 bg-white px-3 py-1.5 text-sm font-medium"
                >
                  {s.name}
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-[#18221B]/60">
              Search products, merchants or aisles across approved Cornubia Flats
              catalogue items.
            </p>
          </div>
        )}

        {query.length > 0 && query.length < 2 && (
          <p className="mt-6 text-sm text-[#18221B]/65">
            Type at least 2 characters.
          </p>
        )}

        {query.length >= 2 && products.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[#18221B]/20 bg-white/70 px-5 py-10 text-center">
            <p className="font-medium">No results for “{query}”</p>
            <p className="mt-2 text-sm text-[#18221B]/65">
              Try another product name, merchant, or browse a category.
            </p>
            <Link href="/browse/groceries" className="mt-4 inline-block text-sm font-semibold underline">
              Browse groceries
            </Link>
          </div>
        )}

        {products.length > 0 && (
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
