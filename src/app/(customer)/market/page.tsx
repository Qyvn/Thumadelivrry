import Link from "next/link";
import Image from "next/image";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const { user, basketCount, locationLabel, zone } = await getCustomerShell();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isAvailable: true,
      category: { code: "MARKET" },
      merchant: { status: "APPROVED", zoneId: zone?.id },
    },
    include: { merchant: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="min-h-full">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm font-medium text-[#18221B]/55">THUMA Market</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
          Groceries & essentials
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#18221B]/65">
          Merchant-owned stock (not THUMA warehouse inventory). Sample catalogue
          for development only.
        </p>

        {products.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#18221B]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-medium">No market products available yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/shops/${p.merchant.slug}`}
                className="rounded-2xl border border-[#18221B]/8 bg-white p-3 transition hover:border-[#18221B]/20"
              >
                <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-[#ebe4d4]">
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="text-sm font-medium leading-snug">{p.name}</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatZar(p.priceCents)}
                </p>
                <p className="mt-1 truncate text-xs text-[#18221B]/45">
                  {p.merchant.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
