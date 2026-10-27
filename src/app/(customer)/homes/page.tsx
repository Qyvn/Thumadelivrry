import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import {
  enquiryWhatsAppUrl,
  homeEnquiryMessage,
  listingTypeLabel,
  propertyTypeLabel,
  WHATSAPP_DISPLAY,
} from "@/lib/onestop";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomesPage({
  searchParams,
}: {
  searchParams: Promise<{
    area?: string;
    type?: string;
    bedrooms?: string;
    maxPrice?: string;
    guests?: string;
    checkIn?: string;
    checkOut?: string;
  }>;
}) {
  const sp = await searchParams;
  const { user, basketCount, locationLabel } = await getCustomerShell();

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (sp.type === "SHORT_STAY" || sp.type === "LONG_TERM") {
    where.listingType = sp.type;
  }
  if (sp.area?.trim()) {
    where.area = { contains: sp.area.trim() };
  }
  const bedrooms = sp.bedrooms ? Number(sp.bedrooms) : NaN;
  if (Number.isFinite(bedrooms) && bedrooms >= 0) {
    where.bedrooms = { gte: bedrooms };
  }
  const maxPriceRand = sp.maxPrice ? Number(sp.maxPrice) : NaN;
  if (Number.isFinite(maxPriceRand) && maxPriceRand > 0) {
    const cents = Math.round(maxPriceRand * 100);
    if (sp.type === "SHORT_STAY") {
      where.nightlyPriceCents = { lte: cents };
    } else if (sp.type === "LONG_TERM") {
      where.monthlyPriceCents = { lte: cents };
    } else {
      where.OR = [
        { nightlyPriceCents: { lte: cents } },
        { monthlyPriceCents: { lte: cents } },
      ];
    }
  }
  const guests = sp.guests ? Number(sp.guests) : NaN;
  if (Number.isFinite(guests) && guests >= 1) {
    where.maxGuests = { gte: guests };
  }

  const homes = await prisma.homeListing.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const areas = await prisma.homeListing.findMany({
    where: { status: "APPROVED" },
    select: { area: true },
    distinct: ["area"],
    orderBy: { area: "asc" },
  });

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-8 sm:max-w-xl">
        <h1 className="display text-4xl text-[var(--ink)]">Homes</h1>
        <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
          Short stays &amp; long-term. Enquiry only via WhatsApp {WHATSAPP_DISPLAY}.
        </p>
        <div className="mt-5">
          <Link
            href="/homes/list"
            className="inline-flex h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]"
          >
            List your home
          </Link>
        </div>

        <form className="mt-8 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">
            Stay type
            <select name="type" defaultValue={sp.type ?? ""} className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="SHORT_STAY">Short stay (nightly)</option>
              <option value="LONG_TERM">Long-term (monthly)</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Area
            <input name="area" list="home-areas" defaultValue={sp.area ?? ""} placeholder="e.g. Ballito" className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm" />
            <datalist id="home-areas">
              {areas.map((a) => (
                <option key={a.area} value={a.area} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold">
            Min bedrooms
            <input name="bedrooms" type="number" min={0} max={20} defaultValue={sp.bedrooms ?? ""} className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Max price (R)
            <input name="maxPrice" type="number" min={0} step={100} defaultValue={sp.maxPrice ?? ""} placeholder="Nightly or monthly" className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Guests (short stay)
            <input name="guests" type="number" min={1} max={40} defaultValue={sp.guests ?? ""} className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Check-in (enquiry)
            <input name="checkIn" type="date" defaultValue={sp.checkIn ?? ""} className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Check-out (enquiry)
            <input name="checkOut" type="date" defaultValue={sp.checkOut ?? ""} className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="h-10 w-full rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)]">
              Filter
            </button>
          </div>
        </form>

        {homes.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[var(--line)] px-5 py-14 text-center">
            <p className="font-semibold">Listings coming soon — list your home</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Submit a listing — Duban reviews every entry.
            </p>
            <Link href="/homes/list" className="mt-4 inline-block text-sm font-medium text-[var(--muted)] underline underline-offset-4">
              List your home
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {homes.map((h) => {
              const price =
                h.listingType === "SHORT_STAY" && h.nightlyPriceCents != null
                  ? `${formatZar(h.nightlyPriceCents)} / night`
                  : h.monthlyPriceCents != null
                    ? `${formatZar(h.monthlyPriceCents)} / month`
                    : "Price on enquiry";
              return (
                <li key={h.id} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {listingTypeLabel(h.listingType)} · {propertyTypeLabel(h.propertyType)} · {h.area}
                  </p>
                  <Link href={`/homes/${h.slug}`} className="mt-1 block font-semibold hover:underline">
                    {h.title}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-[#0E3B24]">{price}</p>
                  <p className="mt-1 text-xs text-[#0E3B24]/55">
                    {h.bedrooms} bed · {h.bathrooms} bath
                    {h.maxGuests ? ` · up to ${h.maxGuests} guests` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{h.description}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">Host: {h.hostName}</p>
                  <a
                    href={enquiryWhatsAppUrl(
                      homeEnquiryMessage({
                        title: h.title,
                        listingType: h.listingType,
                        area: h.area,
                        checkIn: sp.checkIn,
                        checkOut: sp.checkOut,
                        guests: Number.isFinite(guests) ? guests : undefined,
                      }),
                    )}
                    className="mt-3 inline-block text-sm font-semibold text-[#1E88C8] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enquire on WhatsApp
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
