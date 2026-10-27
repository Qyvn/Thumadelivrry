import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gemCategoryLabel } from "@/lib/onestop";
import { reviewGemAction } from "./actions";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  d.toLocaleDateString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function AdminGemsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  await requireUser(["ADMIN", "SUPPORT"]);
  const [pending, approved, rejected] = await Promise.all([
    prisma.hiddenGem.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "asc" } }),
    prisma.hiddenGem.findMany({ where: { status: "APPROVED" }, orderBy: { updatedAt: "desc" }, take: 30 }),
    prisma.hiddenGem.findMany({
      where: { status: { in: ["REJECTED", "SUSPENDED"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-[#0E3B24]">
      <Link href="/admin" className="text-sm underline">← Admin dashboard</Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">Hidden Gems</h1>
      <p className="mt-1 text-sm text-[#0E3B24]/65">
        Approve real submissions only. Never invent places, addresses or reviews.
      </p>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {saved && <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Saved: {saved}</p>}

      <section className="mt-6">
        <h2 className="text-xl font-bold">Review queue ({pending.length})</h2>
        {pending.length === 0 && <p className="mt-2 text-sm text-[#0E3B24]/65">No gems waiting.</p>}
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {pending.map((g) => (
            <article key={g.id} className="rounded-2xl bg-white p-5 text-sm">
              <p className="text-base font-semibold">{g.name}</p>
              <p className="text-[#0E3B24]/60">
                {gemCategoryLabel(g.category)} · {g.area}, {g.city} · {fmt(g.createdAt)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{g.description}</p>
              {g.tipNote && <p className="mt-2 text-xs">Tip: {g.tipNote}</p>}
              {g.addressHint && <p className="mt-1 text-xs">Hint: {g.addressHint}</p>}
              <p className="mt-2 text-xs text-[#0E3B24]/45">
                Submitted by {g.submitterName}
                {g.submitterPhone ? ` · ${g.submitterPhone}` : ""}
                {g.submitterEmail ? ` · ${g.submitterEmail}` : ""}
              </p>
              <form action={reviewGemAction} className="mt-4 space-y-2">
                <input type="hidden" name="id" value={g.id} />
                <Textarea name="reviewNotes" rows={2} placeholder="Review notes (optional)" />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="decision" value="APPROVED" size="sm">Approve</Button>
                  <Button type="submit" name="decision" value="REJECTED" size="sm" variant="outline">Reject</Button>
                </div>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Approved ({approved.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {approved.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3">
              <span>
                <Link href={`/gems/${g.slug}`} className="font-semibold underline">{g.name}</Link>
                <span className="text-[#0E3B24]/55"> · {g.area}</span>
              </span>
              <form action={reviewGemAction}>
                <input type="hidden" name="id" value={g.id} />
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
            {rejected.map((g) => (
              <li key={g.id}>{g.name} · {g.status} · {g.area}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
