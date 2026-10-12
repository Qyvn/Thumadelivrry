import Link from "next/link";
import Image from "next/image";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EatsPage() {
  const { user, basketCount, locationLabel, zone } = await getCustomerShell();

  const merchants = await prisma.merchant.findMany({
    where: {
      status: "APPROVED",
      zoneId: zone?.id,
      products: { some: { category: { code: "EATS" }, isActive: true } },
    },
    include: {
      products: {
        where: { category: { code: "EATS" }, isActive: true },
        take: 1,
      },
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
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
        <p className="text-sm font-medium text-[#18221B]/55">THUMA Eats</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
          Food near Cornubia Flats
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#18221B]/65">
          Sample restaurants for development. Only approved merchants appear
          publicly.
        </p>

        {merchants.length === 0 ? (
          <EmptyState message="No THUMA Eats merchants are available in this zone yet." />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {merchants.map((m) => (
              <Link
                key={m.id}
                href={`/shops/${m.slug}`}
                className="overflow-hidden rounded-2xl border border-[#18221B]/8 bg-white transition hover:border-[#18221B]/20"
              >
                <div className="relative h-40 bg-[#ebe4d4]">
                  {m.imageUrl && (
                    <Image
                      src={m.imageUrl}
                      alt={m.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold">{m.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-[#18221B]/65">
                    {m.description}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[#18221B]/45">
                    {m._count.products} items · {m.isDevSample ? "DEV SAMPLE" : "Approved"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-[#18221B]/20 bg-white/70 px-5 py-12 text-center">
      <p className="font-medium">{message}</p>
    </div>
  );
}
