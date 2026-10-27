import Link from "next/link";
import { House } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import {
  enquiryWhatsAppUrl,
  homeEnquiryMessage,
  HOME_PROPERTY_TYPES,
  propertyTypeLabel,
  WHATSAPP_DISPLAY,
} from "@/lib/onestop";
import { cn, formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StaysPage({
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
  const typeOk = HOME_PROPERTY_TYPES.some((t) => t.code === sp.type);
  if (typeOk) {
    where.propertyType = sp.type;
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
    where.OR = [
      { nightlyPriceCents: { lte: cents } },
      { monthlyPriceCents: { lte: cents } },
    ];
  }
  const guests = sp.guests ? Number(sp.guests) : NaN;
  if (Number.isFinite(guests) && guests >= 1) {
    where.maxGuests = { gte: guests };
  }

  const stays = await prisma.homeListing.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const areas = await prisma.homeListing.findMany({
    where: { status: "APPROVED" },
    select: { area: true },
    distinct: ["area"],
    orderBy: { area: "asc" },
  });

  const chipHref = (code: string) => {
    const q = new URLSearchParams();
    if (code) q.set("type", code);
    if (sp.area) q.set("area", sp.area);
    if (sp.bedrooms) q.set("bedrooms", sp.bedrooms);
    if (sp.maxPrice) q.set("maxPrice", sp.maxPrice);
    if (sp.guests) q.set("guests", sp.guests);
    if (sp.checkIn) q.set("checkIn", sp.checkIn);
    if (sp.checkOut) q.set("checkOut", sp.checkOut);
    const s = q.toString();
    return s ? `/stays?${s}` : "/stays";
  };

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-8 sm:max-w-xl">
        <h1 className="display text-4xl text-[var(--ink)]">Stays</h1>
        <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
          Hotels, guesthouses, B&amp;Bs and homes. Enquiry only via WhatsApp{" "}
          {WHATSAPP_DISPLAY}.
        </p>
        <div className="mt-5">
          <Link
            href="/stays/list"
            className="inline-flex h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]"
          >
            List your stay
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Stay type">
          <Link
            href={chipHref("")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              !typeOk
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--ink)]",
            )}
          >
            All
          </Link>
          {HOME_PROPERTY_TYPES.map((t) => (
            <Link
              key={t.code}
              href={chipHref(t.code)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                sp.type === t.code
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                  : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--ink)]",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <form className="mt-6 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:grid-cols-2">
          {typeOk && <input type="hidden" name="type" value={sp.type} />}
          <label className="text-xs font-semibold">
            Area
            <input
              name="area"
              list="stay-areas"
              defaultValue={sp.area ?? ""}
              placeholder="e.g. Ballito"
              className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
            <datalist id="stay-areas">
              {areas.map((a) => (
                <option key={a.area} value={a.area} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold">
            Min bedrooms
            <input
              name="bedrooms"
              type="number"
              min={0}
              max={20}
              defaultValue={sp.bedrooms ?? ""}
              className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            Max price (R)
            <input
              name="maxPrice"
              type="number"
              min={0}
              step={100}
              defaultValue={sp.maxPrice ?? ""}
              placeholder="Nightly or monthly"
              className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            Guests
            <input
              name="guests"
              type="number"
              min={1}
              max={40}
              defaultValue={sp.guests ?? ""}
              className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            Check-in (enquiry)
            <input
              name="checkIn"
              type="date"
              defaultValue={sp.checkIn ?? ""}
              className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            Check-out (enquiry)
            <input
              name="checkOut"
              type="date"
              defaultValue={sp.checkOut ?? ""}
              className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              className="h-10 w-full rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)]"
            >
              Filter
            </button>
          </div>
        </form>

        {stays.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={House}
              title="Stays coming soon — list yours"
              body="Submit a listing — Duban reviews every entry. Enquiry only via WhatsApp."
              actionHref="/stays/list"
              actionLabel="List your stay"
            />
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {stays.map((h) => {
              const price =
                h.listingType === "SHORT_STAY" && h.nightlyPriceCents != null
                  ? `${formatZar(h.nightlyPriceCents)} / night`
                  : h.monthlyPriceCents != null
                    ? `${formatZar(h.monthlyPriceCents)} / month`
                    : "Price on enquiry";
              return (
                <li
                  key={h.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5"
                >
                  <p className="text-[11px] font-medium text-[var(--muted)]">
                    {propertyTypeLabel(h.propertyType)} · {h.area}
                  </p>
                  <Link
                    href={`/stays/${h.slug}`}
                    className="mt-1 block font-semibold hover:underline"
                  >
                    {h.title}
                  </Link>
                  <p className="mt-1 text-sm font-semibold">{price}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {h.bedrooms} bed · {h.bathrooms} bath
                    {h.maxGuests ? ` · up to ${h.maxGuests} guests` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                    {h.description}
                  </p>
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
                    className="mt-3 inline-block text-sm font-medium text-[var(--muted)] underline underline-offset-4"
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
