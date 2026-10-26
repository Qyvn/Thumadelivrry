import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { BROWSE_CATEGORIES } from "@/lib/browse";
import { prisma } from "@/lib/db";
import { merchantForUser } from "@/lib/merchant-onboarding";
import { defaultBrowseCategory } from "@/lib/onboarding";
import { normalisePricingCategory } from "@/lib/pricing";
import { formatZar } from "@/lib/utils";
import { importCsvAction, saveProductAction } from "./actions";

export const dynamic = "force-dynamic";

type P = {
  id: string; name: string; priceCents: number; description: string | null;
  imageUrl: string | null; isAvailable: boolean; browseCategory: string;
};

function ProductForm({ merchantId, product, defaultAisle }: { merchantId: string; product?: P; defaultAisle: string }) {
  return (
    <form action={saveProductAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="merchantId" value={merchantId} />
      {product && <input type="hidden" name="productId" value={product.id} />}
      <label className="text-sm">Name *<Input name="name" required maxLength={120} defaultValue={product?.name} /></label>
      <label className="text-sm">Price (R) *<Input name="price" required inputMode="decimal" placeholder="65.00" defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""} /></label>
      <label className="text-sm sm:col-span-2">Description<Input name="description" maxLength={500} defaultValue={product?.description ?? ""} /></label>
      <label className="text-sm">Aisle
        <select name="browseCategory" defaultValue={product?.browseCategory ?? defaultAisle} className="flex h-11 w-full rounded-xl border border-[#0E3B24]/15 bg-white px-3 text-sm">
          {BROWSE_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <label className="text-sm">Image (PNG/JPEG/WebP ≤300 KB)<input type="file" name="image" accept="image/png,image/jpeg,image/webp" className="mt-2 block text-xs" /></label>
      <div className="flex flex-wrap items-center gap-4 text-sm sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="isAvailable" defaultChecked={product?.isAvailable ?? true} /> Available</label>
        {product?.imageUrl && <label className="flex items-center gap-2"><input type="checkbox" name="removeImage" /> Remove image</label>}
        <Button type="submit" size="sm" className="ml-auto">{product ? "Save changes" : "Add product"}</Button>
      </div>
    </form>
  );
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; merchantId?: string }>;
}) {
  const { error, saved, merchantId } = await searchParams;
  const user = await requireUser(["MERCHANT_STAFF", "ADMIN"]);
  const merchant = await merchantForUser(user, merchantId);

  if (!merchant) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 text-center text-[#0E3B24]">
        <p className="font-semibold">No merchant linked to this account.</p>
        {user.role === "ADMIN" && <p className="mt-2 text-sm">Admins: open a merchant via ?merchantId=…</p>}
        <Link href="/merchant/apply" className="mt-4 inline-block underline">Apply to sell on Duban</Link>
      </main>
    );
  }
  const products = await prisma.product.findMany({ where: { merchantId: merchant.id, isActive: true }, orderBy: { sortOrder: "asc" } });
  const aisle = defaultBrowseCategory(normalisePricingCategory(merchant.pricingCategory));

  return (
    <div className="min-h-full bg-[#F7F3EA] text-[#0E3B24]">
      <header className="bg-[#0E3B24] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#FFB627]">Duban Merchant</p>
            <p className="text-sm text-white/70">{merchant.name}</p>
          </div>
          <Link href="/merchant" className="text-sm text-[#FFB627]">Orders</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
        {saved && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{saved}</p>}
        {merchant.status !== "APPROVED" && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm">This merchant is {merchant.status}; the catalogue is read-only.</p>}

        {products.length === 0 && (
          <section className="rounded-2xl border border-dashed border-[#0E3B24]/25 bg-white p-5">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Set up your {merchant.pricingCategory === "FOOD" ? "menu" : "catalogue"}</h1>
            <p className="mt-1 text-sm text-[#0E3B24]/65">Customers see your shop once you add at least one available product. Add items one by one, or upload a CSV.</p>
          </section>
        )}

        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-lg font-bold">Add a product</h2>
          <div className="mt-3"><ProductForm merchantId={merchant.id} defaultAisle={aisle} /></div>
        </section>

        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-lg font-bold">Bulk upload (CSV)</h2>
          <p className="mt-1 text-sm text-[#0E3B24]/65">
            Columns: name, price (rand), description, available (yes/no), aisle ({BROWSE_CATEGORIES.map((c) => c.slug).join(", ")}).
            Rows matching an existing product name update it. If any row is invalid, nothing is imported.
          </p>
          <a href="/merchant/catalogue/template.csv" className="mt-2 inline-block text-sm font-semibold underline" download>Download CSV template</a>
          <form action={importCsvAction} className="mt-3 flex flex-wrap items-center gap-3">
            <input type="hidden" name="merchantId" value={merchant.id} />
            <input type="file" name="csv" accept=".csv,text/csv" required className="text-sm" />
            <Button type="submit" size="sm" variant="outline">Upload CSV</Button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-bold">Your products ({products.length})</h2>
          <ul className="mt-3 space-y-3">
            {products.map((p) => (
              <li key={p.id} className="rounded-2xl bg-white p-4">
                <details>
                  <summary className="flex cursor-pointer items-center gap-3 text-sm">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : <span className="h-10 w-10 rounded-lg bg-[#efe6d2]" />}
                    <span className="flex-1 font-medium">{p.name}{!p.isAvailable && <span className="ml-2 text-xs text-red-700">Unavailable</span>}</span>
                    <span className="font-semibold">{formatZar(p.priceCents)}</span>
                    <span className="text-xs underline">Edit</span>
                  </summary>
                  <div className="mt-3"><ProductForm merchantId={merchant.id} product={p} defaultAisle={aisle} /></div>
                </details>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-center text-sm"><Link className="underline" href={`/shops/${merchant.slug}`}>View your shop as customers see it</Link></p>
      </main>
    </div>
  );
}
