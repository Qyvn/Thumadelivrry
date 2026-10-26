import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { QuantityAdd } from "@/components/quantity-add";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/utils";
import { browseCategoryBySlug } from "@/lib/browse";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, basketCount, locationLabel, basketQtyByProduct } =
    await getCustomerShell();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { merchant: true, category: true },
  });

  if (!product || !product.isActive || product.merchant.status !== "APPROVED") {
    notFound();
  }

  const browse = browseCategoryBySlug(product.browseCategory);

  return (
    <div className="min-h-full bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={browse ? `/browse/${browse.slug}` : "/"}
          className="text-sm font-medium underline"
        >
          Back to {browse?.name ?? "shopping"}
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#0E3B24]/8 bg-white">
          <div className="relative aspect-[4/3] bg-[#efe6d2]">
            {product.imageUrl && (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0E3B24]/45">
              {browse?.name ?? product.category.name}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              {product.name}
            </h1>
            {product.packageSize && (
              <p className="mt-1 text-sm text-[#0E3B24]/60">{product.packageSize}</p>
            )}
            <p className="mt-3 text-2xl font-bold">{formatZar(product.priceCents)}</p>
            <Link
              href={`/shops/${product.merchant.slug}`}
              className="mt-2 inline-block text-sm font-medium underline"
            >
              {product.merchant.name}
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#0E3B24]/70">
              {product.description}
            </p>
            <p className="mt-3 text-xs text-[#0E3B24]/45">
              Availability:{" "}
              {product.isAvailable
                ? typeof product.stockQty === "number"
                  ? `${product.stockQty} in stock`
                  : "Available"
                : "Out of stock"}{" "}
              · Stock owner: {product.inventoryOwner}
              {product.isDevSample ? " · DEV SAMPLE" : ""}
            </p>

            <div className="mt-6 max-w-sm">
              <QuantityAdd
                productId={product.id}
                isAvailable={product.isAvailable}
                initialQty={basketQtyByProduct[product.id] ?? 0}
              />
            </div>
            <p className="mt-3 text-xs text-[#0E3B24]/50">
              Baskets are single-merchant for fulfilment simplicity. Mixing shops
              requires clearing your basket first.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
