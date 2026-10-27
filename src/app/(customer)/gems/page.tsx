import Link from "next/link";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import {
  GEM_CATEGORIES,
  gemCategoryLabel,
  enquiryWhatsAppUrl,
  gemEnquiryMessage,
  WHATSAPP_DISPLAY,
} from "@/lib/onestop";

export const dynamic = "force-dynamic";

export default async function GemsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; area?: string }>;
}) {
  const { category, area } = await searchParams;
  const { user, basketCount, locationLabel } = await getCustomerShell();

  const where: {
    status: string;
    category?: string;
    area?: { contains: string };
  } = { status: "APPROVED" };
  if (category && GEM_CATEGORIES.some((c) => c.code === category)) {
    where.category = category;
  }
  if (area?.trim()) {
    where.area = { contains: area.trim() };
  }

  const gems = await prisma.hiddenGem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const areas = await prisma.hiddenGem.findMany({
    where: { status: "APPROVED" },
    select: { area: true },
    distinct: ["area"],
    orderBy: { area: "asc" },
  });

  return (
    <div className="flex min-h-full flex-col bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav user={user} basketCount={basketCount} locationLabel={locationLabel} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0E3B24]/40">
          Duban · Hidden Gems
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[#0E3B24]">
          Hidden Gems
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#0E3B24]/65">
          Real Durban spots submitted by locals and approved by Duban. We never invent places,
          reviews or ratings. Enquiries go to WhatsApp {WHATSAPP_DISPLAY}.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/gems/submit"
            className="inline-flex h-10 items-center rounded-full bg-[#FFB627] px-4 text-sm font-bold text-[#0E3B24]"
          >
            Submit a gem
          </Link>
          <Link href="/food" className="inline-flex h-10 items-center rounded-full border border-[#0E3B24]/15 bg-white px-4 text-sm font-semibold">
            Food &amp; Shops
          </Link>
          <Link href="/homes" className="inline-flex h-10 items-center rounded-full border border-[#0E3B24]/15 bg-white px-4 text-sm font-semibold">
            Homes
          </Link>
        </div>

        <form className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#0E3B24]/8 bg-white p-4">
          <label className="text-xs font-semibold">
            Category
            <select
              name="category"
              defaultValue={category ?? ""}
              className="mt-1 block rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {GEM_CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Area
            <input
              name="area"
              list="gem-areas"
              defaultValue={area ?? ""}
              placeholder="e.g. Umhlanga"
              className="mt-1 block rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm"
            />
            <datalist id="gem-areas">
              {areas.map((a) => (
                <option key={a.area} value={a.area} />
              ))}
            </datalist>
          </label>
          <button
            type="submit"
            className="mt-5 h-10 rounded-xl bg-[#0E3B24] px-4 text-sm font-bold text-[#FFB627]"
          >
            Filter
          </button>
        </form>

        {gems.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-semibold">Gems coming soon</p>
            <p className="mt-2 text-sm text-[#0E3B24]/65">
              No approved spots match these filters yet. Know a local favourite? Submit a gem —
              we review every entry before it goes live.
            </p>
            <Link href="/gems/submit" className="mt-4 inline-block text-sm font-semibold underline">
              Submit a gem
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {gems.map((g) => (
              <li key={g.id} className="rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0E3B24]/45">
                  {gemCategoryLabel(g.category)} · {g.area}
                </p>
                <Link href={`/gems/${g.slug}`} className="mt-1 block font-semibold hover:underline">
                  {g.name}
                </Link>
                <p className="mt-2 line-clamp-3 text-sm text-[#0E3B24]/65">{g.description}</p>
                <a
                  href={enquiryWhatsAppUrl(gemEnquiryMessage(g))}
                  className="mt-3 inline-block text-sm font-semibold text-[#1E88C8] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Enquire on WhatsApp
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
