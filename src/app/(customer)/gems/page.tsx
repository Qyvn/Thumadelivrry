import Link from "next/link";
import { Gem } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/app-shell";
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
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-8 sm:max-w-xl">
        <h1 className="display text-4xl text-[var(--ink)]">Gems</h1>
        <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
          Local spots, approved by Duban. Enquiries via WhatsApp {WHATSAPP_DISPLAY}.
        </p>
        <div className="mt-5">
          <Link
            href="/gems/submit"
            className="inline-flex h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]"
          >
            Submit a gem
          </Link>
        </div>

        <form className="mt-8 flex flex-wrap gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <label className="text-xs font-semibold">
            Category
            <select
              name="category"
              defaultValue={category ?? ""}
              className="mt-1 block rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
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
              className="mt-1 block rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
            <datalist id="gem-areas">
              {areas.map((a) => (
                <option key={a.area} value={a.area} />
              ))}
            </datalist>
          </label>
          <button
            type="submit"
            className="mt-5 h-10 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)]"
          >
            Filter
          </button>
        </form>

        {gems.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={Gem}
              title="Gems coming soon"
              body="Know a spot? Submit it — we review every entry before it goes live."
              actionHref="/gems/submit"
              actionLabel="Submit a gem"
            />
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {gems.map((g) => (
              <li key={g.id} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {gemCategoryLabel(g.category)} · {g.area}
                </p>
                <Link href={`/gems/${g.slug}`} className="mt-1 block font-semibold hover:underline">
                  {g.name}
                </Link>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">{g.description}</p>
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
    </AppShell>
  );
}
