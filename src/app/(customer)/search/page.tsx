import Link from "next/link";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { Input } from "@/components/ui/input";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const { user, basketCount, locationLabel, zone } = await getCustomerShell();

  const products =
    query.length >= 2
      ? await prisma.product.findMany({
          where: {
            isActive: true,
            merchant: { status: "APPROVED", zoneId: zone?.id },
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { merchant: { name: { contains: query } } },
            ],
          },
          include: { merchant: true, category: true },
          take: 30,
        })
      : [];

  return (
    <div className="min-h-full">
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
            placeholder="Search meals, shops, essentials…"
            aria-label="Search"
          />
        </form>

        {query.length > 0 && query.length < 2 && (
          <p className="mt-6 text-sm text-[#18221B]/65">
            Type at least 2 characters.
          </p>
        )}

        {query.length >= 2 && products.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[#18221B]/20 bg-white/70 px-5 py-10 text-center">
            <p className="font-medium">No results for “{query}”</p>
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/shops/${p.merchant.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#18221B]/8 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-[#18221B]/55">
                    {p.merchant.name} · {p.category.name}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatZar(p.priceCents)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
