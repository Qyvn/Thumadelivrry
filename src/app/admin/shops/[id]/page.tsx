import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  addShopCatalogueItemAction,
  publishShopAction,
  unpublishShopAction,
} from "@/app/admin/shops/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShopBacklogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  await requireUser(["ADMIN", "SUPPORT"]);

  const shop = await prisma.merchant.findUnique({
    where: { id },
    include: {
      products: {
        where: { isDevSample: false },
        include: { category: true },
        orderBy: [{ browseCategory: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!shop || shop.isDevSample) notFound();

  const menuItems = shop.products.filter(
    (p) => p.browseCategory === "food" || p.category.code === "EATS",
  );
  const stockItems = shop.products.filter(
    (p) => p.browseCategory !== "food" && p.category.code !== "EATS",
  );
  const draft = shop.status === "DRAFT";

  return (
    <div className="min-h-full bg-[#F7F3EA]">
      <header className="border-b border-[#0E3B24]/10 bg-[#0E3B24] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/shops" className="text-sm text-[#FFB627]">
              ← Shop backlog
            </Link>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
              {shop.name}
            </p>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="border-[#FFB627]/40 text-[#FFB627]"
            >
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <section className="rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0E3B24]/45">
                Shop name
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                {shop.name}
              </h1>
              <p className="mt-2 text-sm text-[#0E3B24]/65">
                {[shop.suburb, shop.city].filter(Boolean).join(", ") || "Location TBD"}
              </p>
              {shop.description && (
                <p className="mt-2 text-sm text-[#0E3B24]/55">{shop.description}</p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                draft ? "bg-[#efe6d2]" : "bg-[#FFB627]"
              }`}
            >
              {draft ? "Backlog / not live" : "Published to customers"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {draft ? (
              <form action={publishShopAction}>
                <input type="hidden" name="merchantId" value={shop.id} />
                <Button type="submit" size="sm">
                  Publish shop
                </Button>
              </form>
            ) : (
              <form action={unpublishShopAction}>
                <input type="hidden" name="merchantId" value={shop.id} />
                <Button type="submit" size="sm" variant="outline">
                  Move back to backlog
                </Button>
              </form>
            )}
          </div>
        </section>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {/* Menu upload space */}
        <section className="rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
          <h2 className="font-semibold">Menu</h2>
          <p className="mt-1 text-sm text-[#0E3B24]/60">
            Space for this shop&apos;s dishes and takeaway items. Add lines as you
            receive their menu.
          </p>

          {menuItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#0E3B24]/15 px-4 py-8 text-center text-sm text-[#0E3B24]/55">
              No menu items yet — upload dishes below when ready.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#0E3B24]/8">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium">{item.name}</span>
                  <span>{formatZar(item.priceCents)}</span>
                </li>
              ))}
            </ul>
          )}

          <form
            action={addShopCatalogueItemAction}
            className="mt-4 grid gap-3 border-t border-[#0E3B24]/8 pt-4 sm:grid-cols-3"
          >
            <input type="hidden" name="merchantId" value={shop.id} />
            <input type="hidden" name="itemKind" value="menu" />
            <Input name="name" placeholder="Dish name" required className="sm:col-span-2" />
            <Input
              name="priceRand"
              type="number"
              min={0}
              step={0.01}
              placeholder="Price (R)"
              required
            />
            <Button type="submit" size="sm" className="sm:col-span-3 sm:w-fit">
              Add menu item
            </Button>
          </form>
        </section>

        {/* Stock upload space */}
        <section className="rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
          <h2 className="font-semibold">Available stock</h2>
          <p className="mt-1 text-sm text-[#0E3B24]/60">
            Space for grocery and retail lines. Add products and quantities as
            stock lists arrive.
          </p>

          {stockItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#0E3B24]/15 px-4 py-8 text-center text-sm text-[#0E3B24]/55">
              No stock lines yet — upload available products below when ready.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#0E3B24]/8">
              {stockItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium">{item.name}</span>
                    {item.packageSize ? (
                      <span className="text-[#0E3B24]/50"> · {item.packageSize}</span>
                    ) : null}
                    {item.stockQty != null ? (
                      <span className="text-[#0E3B24]/50"> · qty {item.stockQty}</span>
                    ) : null}
                  </span>
                  <span>{formatZar(item.priceCents)}</span>
                </li>
              ))}
            </ul>
          )}

          <form
            action={addShopCatalogueItemAction}
            className="mt-4 grid gap-3 border-t border-[#0E3B24]/8 pt-4 sm:grid-cols-2"
          >
            <input type="hidden" name="merchantId" value={shop.id} />
            <input type="hidden" name="itemKind" value="stock" />
            <Input name="name" placeholder="Product name" required className="sm:col-span-2" />
            <Input name="packageSize" placeholder="Size (e.g. 2L, 500g)" />
            <Input
              name="stockQty"
              type="number"
              min={0}
              step={1}
              placeholder="Qty on hand (optional)"
            />
            <Input
              name="priceRand"
              type="number"
              min={0}
              step={0.01}
              placeholder="Price (R)"
              required
            />
            <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit">
              Add stock item
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
