import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseAmenitiesJson,
  propertyTypeLabel,
} from "@/lib/onestop";
import { formatZar } from "@/lib/utils";
import { reviewHomeAction } from "./actions";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  d.toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function AdminStaysPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  await requireUser(["ADMIN", "SUPPORT"]);
  const [pending, approved, rejected] = await Promise.all([
    prisma.homeListing.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "asc" } }),
    prisma.homeListing.findMany({ where: { status: "APPROVED" }, orderBy: { updatedAt: "desc" }, take: 30 }),
    prisma.homeListing.findMany({
      where: { status: { in: ["REJECTED", "SUSPENDED"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-[#0E3B24]">
      <Link href="/admin" className="text-sm underline">← Admin dashboard</Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">Stays</h1>
      <p className="mt-1 text-sm text-[#0E3B24]/65">
        Approve stay submissions only — enquiry-only, no payments. Never invent listings,
        prices or reviews.
      </p>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {saved && <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Saved: {saved}</p>}

      <section className="mt-6">
        <h2 className="text-xl font-bold">Review queue ({pending.length})</h2>
        {pending.length === 0 && <p className="mt-2 text-sm text-[#0E3B24]/65">No stays waiting.</p>}
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {pending.map((h) => {
            const amenities = parseAmenitiesJson(h.amenitiesJson);
            const price =
              h.listingType === "SHORT_STAY" && h.nightlyPriceCents != null
                ? `${formatZar(h.nightlyPriceCents)}/night`
                : h.monthlyPriceCents != null
                  ? `${formatZar(h.monthlyPriceCents)}/month`
                  : "—";
            return (
              <article key={h.id} className="rounded-2xl bg-white p-5 text-sm">
                <p className="text-base font-semibold">{h.title}</p>
                <p className="text-[#0E3B24]/60">
                  {propertyTypeLabel(h.propertyType)} · {h.area} · {fmt(h.createdAt)}
                </p>
                <p className="mt-1 font-bold">{price}</p>
                <p className="mt-1 text-xs">
                  {h.bedrooms} bed · {h.bathrooms} bath
                  {h.maxGuests ? ` · ${h.maxGuests} guests` : ""}
                  {h.minNights ? ` · min ${h.minNights} nights` : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap line-clamp-6">{h.description}</p>
                {h.propertyType === "HOTEL" && h.hotelRoomTypesNote && (
                  <p className="mt-2 text-xs"><span className="font-semibold">Rooms:</span> {h.hotelRoomTypesNote}</p>
                )}
                {h.propertyType === "HOTEL" && h.websiteUrl && (
                  <p className="mt-1 text-xs">
                    Website:{" "}
                    <a href={h.websiteUrl} target="_blank" rel="noreferrer" className="underline">
                      {h.websiteUrl}
                    </a>
                  </p>
                )}
                {amenities.length > 0 && (
                  <p className="mt-2 text-xs">Amenities: {amenities.join(", ")}</p>
                )}
                <p className="mt-2 text-xs text-[#0E3B24]/45">
                  Host {h.hostName} · {h.hostPhone}
                  {h.hostEmail ? ` · ${h.hostEmail}` : ""}
                </p>
                {h.hostBio && <p className="mt-1 text-xs">Bio: {h.hostBio}</p>}
                <form action={reviewHomeAction} className="mt-4 space-y-2">
                  <input type="hidden" name="id" value={h.id} />
                  <Textarea name="reviewNotes" rows={2} placeholder="Review notes (optional)" />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" name="decision" value="APPROVED" size="sm">Approve</Button>
                    <Button type="submit" name="decision" value="REJECTED" size="sm" variant="outline">Reject</Button>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Approved ({approved.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {approved.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3">
              <span>
                <Link href={`/stays/${h.slug}`} className="font-semibold underline">{h.title}</Link>
                <span className="text-[#0E3B24]/55"> · {h.area} · {propertyTypeLabel(h.propertyType)}</span>
              </span>
              <form action={reviewHomeAction}>
                <input type="hidden" name="id" value={h.id} />
                <Button type="submit" name="decision" value="SUSPENDED" size="sm" variant="outline">Suspend</Button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {rejected.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Rejected / suspended</h2>
          <ul className="mt-3 space-y-1 text-sm text-[#0E3B24]/65">
            {rejected.map((h) => (
              <li key={h.id}>{h.title} · {h.status} · {h.area}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
