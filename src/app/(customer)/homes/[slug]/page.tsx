import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import {
  enquiryWhatsAppUrl,
  homeEnquiryMessage,
  listingTypeLabel,
  parseAmenitiesJson,
  parsePhotosJson,
  propertyTypeLabel,
  WHATSAPP_DISPLAY,
} from "@/lib/onestop";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const listing = await prisma.homeListing.findFirst({
    where: { slug, status: "APPROVED" },
  });
  if (!listing) notFound();
  const { user, basketCount, locationLabel } = await getCustomerShell();
  const amenities = parseAmenitiesJson(listing.amenitiesJson);
  const photos = parsePhotosJson(listing.photosJson);
  const guests = sp.guests ? Number(sp.guests) : undefined;

  const price =
    listing.listingType === "SHORT_STAY" && listing.nightlyPriceCents != null
      ? `${formatZar(listing.nightlyPriceCents)} / night`
      : listing.monthlyPriceCents != null
        ? `${formatZar(listing.monthlyPriceCents)} / month`
        : "Price on enquiry";

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-5">
        <Link href="/homes" className="text-sm underline">← Homes</Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#0E3B24]/45">
          {listingTypeLabel(listing.listingType)} · {propertyTypeLabel(listing.propertyType)} ·{" "}
          {listing.area}, {listing.city}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
          {listing.title}
        </h1>
        <p className="mt-2 text-xl font-bold">{price}</p>
        <p className="mt-1 text-sm text-[#0E3B24]/60">
          {listing.bedrooms} bedroom{listing.bedrooms === 1 ? "" : "s"} · {listing.bathrooms} bathroom
          {listing.bathrooms === 1 ? "" : "s"}
          {listing.beds != null ? ` · ${listing.beds} bed${listing.beds === 1 ? "" : "s"}` : ""}
          {listing.maxGuests != null ? ` · up to ${listing.maxGuests} guests` : ""}
        </p>

        {photos.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-2">
            {photos.slice(0, 6).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src.slice(0, 40)} src={src} alt="" className="h-36 w-full rounded-xl object-cover" />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#0E3B24]/15 bg-white px-4 py-10 text-center text-sm text-[#0E3B24]/55">
            Photos coming soon — host has not uploaded images yet.
          </div>
        )}

        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[#0E3B24]/80">
          {listing.description}
        </p>

        {listing.listingType === "SHORT_STAY" && (
          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 text-sm">
            <div>
              <dt className="text-xs text-[#0E3B24]/45">Min nights</dt>
              <dd className="font-semibold">{listing.minNights ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#0E3B24]/45">Check-in from</dt>
              <dd className="font-semibold">{listing.checkInFrom ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#0E3B24]/45">Check-out by</dt>
              <dd className="font-semibold">{listing.checkOutBy ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#0E3B24]/45">Max guests</dt>
              <dd className="font-semibold">{listing.maxGuests ?? "—"}</dd>
            </div>
          </dl>
        )}

        {amenities.length > 0 && (
          <section className="mt-6">
            <h2 className="font-semibold">Amenities</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {amenities.map((a) => (
                <li key={a} className="rounded-full bg-white px-3 py-1 text-xs font-medium border border-[#0E3B24]/10">
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
          <h2 className="font-semibold">Host</h2>
          <p className="mt-1 text-sm font-medium">{listing.hostName}</p>
          {listing.hostBio && (
            <p className="mt-2 text-sm text-[#0E3B24]/65">{listing.hostBio}</p>
          )}
        </section>

        {listing.addressHint && (
          <p className="mt-4 text-sm text-[#0E3B24]/65">Area hint: {listing.addressHint}</p>
        )}

        <div className="mt-8 rounded-2xl border border-[#0E3B24]/10 bg-white p-5">
          <p className="text-sm font-semibold">Enquiry only — no payments on Duban</p>
          <p className="mt-1 text-sm text-[#0E3B24]/65">
            Ask about availability, dates and house rules on WhatsApp {WHATSAPP_DISPLAY}. Duban
            does not collect deposits or rent.
          </p>
          {listing.listingType === "SHORT_STAY" && (
            <form className="mt-4 grid gap-3 sm:grid-cols-3" method="get">
              <label className="text-xs font-semibold">
                Check-in
                <input name="checkIn" type="date" defaultValue={sp.checkIn ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold">
                Check-out
                <input name="checkOut" type="date" defaultValue={sp.checkOut ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold">
                Guests
                <input name="guests" type="number" min={1} max={listing.maxGuests ?? 40} defaultValue={sp.guests ?? ""} className="mt-1 block w-full rounded-xl border border-[#0E3B24]/15 px-3 py-2 text-sm" />
              </label>
              <button type="submit" className="sm:col-span-3 h-10 rounded-xl border border-[#0E3B24]/15 text-sm font-semibold">
                Update enquiry dates
              </button>
            </form>
          )}
          <a
            href={enquiryWhatsAppUrl(
              homeEnquiryMessage({
                title: listing.title,
                listingType: listing.listingType,
                area: listing.area,
                checkIn: sp.checkIn,
                checkOut: sp.checkOut,
                guests: Number.isFinite(guests) ? guests : undefined,
              }),
            )}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-[#25D366] px-5 text-sm font-bold text-white"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp enquiry
          </a>
        </div>
      </main>
    </AppShell>
  );
}
