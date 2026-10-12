import Image from "next/image";
import { notFound } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { Button } from "@/components/ui/button";
import { addToBasketAction } from "@/app/actions/basket";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, basketCount, locationLabel } = await getCustomerShell();

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: { category: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!merchant || merchant.status !== "APPROVED") notFound();

  return (
    <div className="min-h-full">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="relative mb-6 h-44 overflow-hidden rounded-2xl bg-[#18221B] sm:h-56">
          {merchant.imageUrl && (
            <Image
              src={merchant.imageUrl}
              alt={merchant.name}
              fill
              className="object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#18221B] to-transparent" />
          <div className="absolute bottom-0 p-5 text-white">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              {merchant.name}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/75">
              {merchant.description}
            </p>
            {merchant.isDevSample && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#D0F27B]">
                Development sample — not a live partner
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {merchant.products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-4 rounded-2xl border border-[#18221B]/8 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-[#ebe4d4] sm:h-24 sm:w-24">
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-semibold">{product.name}</h2>
                  <span className="text-xs uppercase tracking-wide text-[#18221B]/45">
                    {product.category.name}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#18221B]/65">
                  {product.description}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {formatZar(product.priceCents)}
                  {!product.isAvailable && (
                    <span className="ml-2 text-red-700">Unavailable</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-[#18221B]/45">
                  Stock owner: {product.inventoryOwner}
                </p>
              </div>
              <form action={addToBasketAction} className="sm:w-40">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="quantity" value="1" />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!product.isAvailable}
                >
                  Add
                </Button>
              </form>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
