import Link from "next/link";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
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
    <div className="flex min-h-full flex-col bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav user={user} basketCount={basketCount} locationLabel={locationLabel} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0E3B24]/40">
          Duban · Homes around Durban
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
          Homes to rent
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#0E3B24]/65">
          Short stays and long-term rentals around Durban. Browse real host listings after admin
          approval. <strong>Enquiries only</strong> via WhatsApp {WHATSAPP_DISPLAY} — Duban does
          not take payments or deposits.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/homes/list"
            className="inline-flex h-10 items-center rounded-full bg-[#FFB627] px-4 text-sm font-bold text-[#0E3B24]"
          >
            List your home
          </Link>
          <Link href="/gems" className="inline-flex h-10 items-center rounded-full border border-[#0E3B24]/15 bg-white px-4 text-sm font-semibold">
            Hidden Gems
          </Link>
          <Link href="/food" className="inline-flex h-10 items-center rounded-full border border-[#0E3B24]/15 bg-white px-4 text-sm font-semibold">
            Food &amp; Shops
          </Link>
        </div>

        <form className="mt-6 grid gap-3 rounded-2xl border border-[#0E3B24]/8 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold">
            Stay type
            <select name="type" defaultValue={sp.type ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="SHORT_STAY">Short stay (nightly)</option>
              <option value="LONG_TERM">Long-term (monthly)</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Area
            <input name="area" list="home-areas" defaultValue={sp.area ?? ""} placeholder="e.g. Ballito" className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm" />
            <datalist id="home-areas">
              {areas.map((a) => (
                <option key={a.area} value={a.area} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold">
            Min bedrooms
            <input name="bedrooms" type="number" min={0} max={20} defaultValue={sp.bedrooms ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Max price (R)
            <input name="maxPrice" type="number" min={0} step={100} defaultValue={sp.maxPrice ?? ""} placeholder="Nightly or monthly" className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Guests (short stay)
            <input name="guests" type="number" min={1} max={40} defaultValue={sp.guests ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Check-in (enquiry)
            <input name="checkIn" type="date" defaultValue={sp.checkIn ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            Check-out (enquiry)
            <input name="checkOut" type="date" defaultValue={sp.checkOut ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 bg-[#F7F3EA] px-3 py-2 text-sm" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="h-10 w-full rounded-xl bg-[#0E3B24] px-4 text-sm font-bold text-[#FFB627]">
              Filter
            </button>
          </div>
        </form>

        {homes.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-semibold">Listings coming soon — list your home</p>
            <p className="mt-2 text-sm text-[#0E3B24]/65">
              No approved homes match these filters yet. Landlords can submit a listing; Duban
              reviews every entry. We never invent addresses, prices or reviews.
            </p>
            <Link href="/homes/list" className="mt-4 inline-block text-sm font-semibold underline">
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
                <li key={h.id} className="rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0E3B24]/45">
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
                  <p className="mt-2 line-clamp-2 text-sm text-[#0E3B24]/65">{h.description}</p>
                  <p className="mt-2 text-xs text-[#0E3B24]/45">Host: {h.hostName}</p>
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
    </div>
  );
}
