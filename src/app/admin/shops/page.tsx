import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { createShopSlotAction } from "@/app/admin/shops/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ShopBacklogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireUser(["ADMIN", "SUPPORT"]);

  const shops = await prisma.merchant.findMany({
    where: { isDevSample: false },
    include: {
      products: {
        where: { isDevSample: false },
        select: { id: true, browseCategory: true, category: { select: { code: true } } },
      },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="min-h-full bg-[#F7F3EA]">
      <header className="border-b border-[#0E3B24]/10 bg-[#0E3B24] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#FFB627]">
              Shop backlog
            </p>
            <p className="text-sm text-white/70">{user.fullName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/admin" className="text-white/70">
              Dashboard
            </Link>
            <Link href="/admin/orders" className="text-white/70">
              Orders
            </Link>
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <section>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Shops · names, menus &amp; stock
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#0E3B24]/65">
            Reserve real partner shops here. Add their names now, then upload menu
            dishes and grocery stock when you have them. Draft shops stay off the
            customer app until you publish.
          </p>
        </section>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
          <h2 className="font-semibold">Add a shop slot</h2>
          <p className="mt-1 text-sm text-[#0E3B24]/60">
            Creates an empty backlog entry ready for menu and stock lines.
          </p>
          <form
            action={createShopSlotAction}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <Input
              name="name"
              placeholder="Shop name"
              required
              className="sm:col-span-2"
            />
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#0E3B24]/45">
                What will you upload?
              </span>
              <select
                name="kind"
                defaultValue="both"
                className="h-11 w-full rounded-xl border border-[#0E3B24]/15 bg-white px-3 text-sm"
              >
                <option value="both">Menu + grocery stock</option>
                <option value="eats">Food menu only</option>
                <option value="market">Grocery stock only</option>
              </select>
            </label>
            <Input name="suburb" placeholder="Suburb" defaultValue="Durban" />
            <Input name="city" placeholder="City" defaultValue="Durban" />
            <Input
              name="notes"
              placeholder="Notes (contact, hours, later upload reminders…)"
              className="sm:col-span-2"
            />
            <Button type="submit" className="sm:col-span-2 sm:w-fit">
              Create shop slot
            </Button>
          </form>
        </section>

        <section>
          <h2 className="font-semibold">
            Backlog ({shops.length})
          </h2>
          {shops.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white px-5 py-12 text-center">
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">
                No shops reserved yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#0E3B24]/65">
                This space is for real partners. Add a shop name above, then open
                it to upload menu items and available stock when you are ready.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {shops.map((shop) => {
                const menuCount = shop.products.filter(
                  (p) =>
                    p.browseCategory === "food" || p.category.code === "EATS",
                ).length;
                const stockCount = shop.products.filter(
                  (p) =>
                    p.browseCategory !== "food" && p.category.code !== "EATS",
                ).length;
                const draft = shop.status === "DRAFT";
                return (
                  <li key={shop.id}>
                    <Link
                      href={`/admin/shops/${shop.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#0E3B24]/8 bg-white px-5 py-4 transition hover:border-[#0E3B24]/25"
                    >
                      <div>
                        <p className="font-semibold">{shop.name}</p>
                        <p className="text-sm text-[#0E3B24]/60">
                          {[shop.suburb, shop.city].filter(Boolean).join(", ")}
                          {" · "}
                          {menuCount} menu · {stockCount} stock
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          draft
                            ? "bg-[#efe6d2] text-[#0E3B24]"
                            : "bg-[#FFB627] text-[#0E3B24]"
                        }`}
                      >
                        {draft ? "Backlog / draft" : "Published"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="text-xs text-[#0E3B24]/45">
          Development sample merchants stay separate and are not listed here.
        </p>
      </main>
    </div>
  );
}
