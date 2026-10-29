import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gemCategoryLabel } from "@/lib/onestop";
import { reviewGemAction, saveGemAction, togglePublishAction } from "./actions";

const CATS = ["BEACH", "FOOD", "NATURE", "CULTURE", "NIGHTLIFE", "SHOPPING", "OTHER"];
const field = "mt-1 w-full rounded-xl border border-[#0E3B24]/20 bg-white px-3 py-3 text-base";

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
  searchParams: Promise<{ error?: string; saved?: string; edit?: string }>;
}) {
  const { error, saved, edit } = await searchParams;
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
  const editing = edit ? await prisma.hiddenGem.findUnique({ where: { id: edit } }) : null;
  const drafts = rejected.filter((g) => g.status === "SUSPENDED");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-[#0E3B24]">
      <Link href="/admin" className="text-sm underline">← Admin dashboard</Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">Hidden Gems</h1>
      <p className="mt-1 text-sm text-[#0E3B24]/65">
        Approve real submissions only. Never invent places, addresses or reviews.
      </p>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {saved && <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Saved: {saved}</p>}


      <section id="add" className="mt-6 rounded-3xl bg-white p-6">
        <h2 className="text-xl font-bold">{editing ? `Edit “${editing.name}”` : "Add a place"}</h2>
        <form action={saveGemAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <label className="text-sm font-medium">Name<input name="name" required defaultValue={editing?.name} className={field} /></label>
          <label className="text-sm font-medium">Area<input name="area" required defaultValue={editing?.area} placeholder="e.g. Umhlanga" className={field} /></label>
          <label className="text-sm font-medium">Category
            <select name="category" defaultValue={editing?.category ?? "BEACH"} className={field}>
              {CATS.map((c) => <option key={c} value={c}>{gemCategoryLabel(c)}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Photo (JPG, PNG or WebP, max 5 MB)
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={field} />
            {editing?.imageUrl && <span className="mt-1 block text-xs text-[#0E3B24]/60">Current photo kept unless you choose a new one.</span>}
          </label>
          <label className="text-sm font-medium sm:col-span-2">Description<Textarea name="description" rows={3} required defaultValue={editing?.description} /></label>
          <label className="flex min-h-12 items-center gap-3 text-base font-medium sm:col-span-2">
            <input type="checkbox" name="publish" defaultChecked={editing ? editing.status === "APPROVED" : true} className="h-6 w-6" />
            Publish now (untick to save as a draft)
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">{editing ? "Save changes" : "Add place"}</Button>
            {editing && <Link href="/admin/gems" className="self-center text-sm underline">Cancel</Link>}
          </div>
        </form>
      </section>
      <section className="mt-10">
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
        <h2 className="text-xl font-bold">Published ({approved.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {approved.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3">
              <span className="flex items-center gap-3">
                {g.imageUrl ? <img src={g.imageUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" /> : <span className="h-14 w-14 rounded-lg bg-[#0E3B24]/10" />}
                <span>
                  <Link href={`/gems/${g.slug}`} className="font-semibold underline">{g.name}</Link>
                  <span className="text-[#0E3B24]/55"> · {g.area}</span>
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Live</span>
                </span>
              </span>
              <span className="flex gap-2">
                <Link href={`/admin/gems?edit=${g.id}#add`} className="rounded-full border px-4 py-2 text-sm">Edit</Link>
                <form action={togglePublishAction}>
                  <input type="hidden" name="id" value={g.id} />
                  <Button type="submit" size="sm" variant="outline">Unpublish</Button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      </section>


      <section className="mt-10">
        <h2 className="text-xl font-bold">Drafts / unpublished ({drafts.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {drafts.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3">
              <span className="flex items-center gap-3">
                {g.imageUrl ? <img src={g.imageUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" /> : <span className="h-14 w-14 rounded-lg bg-[#0E3B24]/10" />}
                <span className="font-semibold">{g.name}</span><span className="text-[#0E3B24]/55">· {g.area}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Draft</span>
              </span>
              <span className="flex gap-2">
                <Link href={`/admin/gems?edit=${g.id}#add`} className="rounded-full border px-4 py-2 text-sm">Edit</Link>
                <form action={togglePublishAction}>
                  <input type="hidden" name="id" value={g.id} />
                  <Button type="submit" size="sm">Publish</Button>
                </form>
              </span>
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
