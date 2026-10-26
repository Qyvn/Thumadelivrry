import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { introRateEndsAt } from "@/lib/onboarding";
import { commissionBps, normalisePricingCategory } from "@/lib/pricing";
import { loadPricingConfig } from "@/lib/pricing-server";
import { formatZar } from "@/lib/utils";
import { reviewApplicationAction } from "./actions";

export const dynamic = "force-dynamic";

const pct = (bps: number) => `${(bps / 100).toFixed(1)}%`;
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric" });

const REASON_LABEL: Record<string, string> = {
  MERCHANT_OVERRIDE: "merchant override",
  INTRO_INDEPENDENT: "intro rate (independent)",
  RESTAURANT: "restaurant default",
  GROCERY_RETAIL: "grocery/retail default",
  PICKUP: "pickup",
};

export default async function AdminMerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  await requireUser(["ADMIN"]);
  const config = await loadPricingConfig();
  const now = new Date();

  const [pending, decided, merchants, commissions, courierEarnings] = await Promise.all([
    prisma.merchantApplication.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "asc" } }),
    prisma.merchantApplication.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.merchant.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.merchantCommission.groupBy({
      by: ["merchantId"],
      _sum: { orderTotalCents: true, commissionCents: true, netPayoutCents: true },
      _count: true,
    }),
    prisma.courierEarning.findMany({ include: { courier: { include: { user: true } } } }),
  ]);
  const commByMerchant = new Map(commissions.map((c) => [c.merchantId, c]));

  const couriers = new Map<
    string,
    { name: string; dev: boolean; deliveries: number; unsettled: number; settled: number; tips: number }
  >();
  for (const e of courierEarnings) {
    const row = couriers.get(e.courierId) ?? {
      name: e.courier.user.fullName,
      dev: e.courier.isDevSample,
      deliveries: 0,
      unsettled: 0,
      settled: 0,
      tips: 0,
    };
    row.deliveries++;
    row.tips += e.tipCents;
    if (e.settled) row.settled += e.amountCents;
    else row.unsettled += e.amountCents;
    couriers.set(e.courierId, row);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-[#0E3B24]">
      <Link href="/admin" className="text-sm underline">← Admin dashboard</Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">Merchants</h1>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {saved && <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{saved}</p>}

      <section className="mt-6">
        <h2 className="text-xl font-bold">Review queue ({pending.length})</h2>
        {pending.length === 0 && <p className="mt-2 text-sm text-[#0E3B24]/65">No applications waiting.</p>}
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {pending.map((a) => {
            const hours = a.hoursJson ? (JSON.parse(a.hoursJson) as Record<string, { open: string; close: string }>) : {};
            return (
              <article key={a.id} className="rounded-2xl bg-white p-5 text-sm" data-testid="application">
                <div className="flex items-start gap-3">
                  {a.logoDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.logoDataUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="text-base font-semibold">{a.businessName}</p>
                    <p className="text-[#0E3B24]/60">
                      {a.pricingCategory} · {a.isIndependent ? "Independent" : "Chain / franchise"} · applied {fmtDate(a.createdAt)}
                    </p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-1">
                  <dt className="text-[#0E3B24]/55">Owner</dt><dd>{a.ownerName ?? a.contactName}</dd>
                  <dt className="text-[#0E3B24]/55">Phone</dt><dd>{a.contactPhone}{a.whatsappPhone ? ` · WhatsApp ${a.whatsappPhone}` : ""}</dd>
                  <dt className="text-[#0E3B24]/55">Email</dt><dd>{a.contactEmail}</dd>
                  <dt className="text-[#0E3B24]/55">Address</dt><dd>{a.addressLine1}, {a.suburb}, {a.city}</dd>
                  <dt className="text-[#0E3B24]/55">Pin</dt>
                  <dd>
                    {a.latitude != null && a.longitude != null ? (
                      <a className="underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=17/${a.latitude}/${a.longitude}`}>
                        {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                      </a>
                    ) : "—"}
                  </dd>
                  <dt className="text-[#0E3B24]/55">Hours</dt>
                  <dd>{Object.entries(hours).map(([d, h]) => `${d} ${h.open}–${h.close}`).join(" · ") || "—"}</dd>
                  {a.notes && (<><dt className="text-[#0E3B24]/55">Notes</dt><dd>{a.notes}</dd></>)}
                </dl>
                {a.isIndependent && config.introCommissionEnabled && (
                  <p className="mt-2 rounded-lg bg-[#F7F3EA] px-3 py-2 text-xs">
                    On approval: intro commission {pct(config.introCommissionBps)} for {config.introCommissionMonths} months
                    (until {fmtDate(introRateEndsAt(now, config.introCommissionMonths))}).
                  </p>
                )}
                <form action={reviewApplicationAction} className="mt-3 space-y-2">
                  <input type="hidden" name="applicationId" value={a.id} />
                  <Textarea name="notes" placeholder="Review notes (required to reject)" maxLength={1000} />
                  <div className="flex gap-2">
                    <Button type="submit" name="decision" value="approve" size="sm">Approve</Button>
                    <Button type="submit" name="decision" value="reject" size="sm" variant="outline">Reject</Button>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      {decided.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Recent decisions</h2>
          <ul className="mt-3 divide-y divide-[#0E3B24]/8 rounded-2xl bg-white text-sm">
            {decided.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                <span>{a.businessName} — <b>{a.status}</b>{a.reviewNotes ? `: ${a.reviewNotes}` : ""}</span>
                <span className="text-[#0E3B24]/55">{a.reviewedAt ? fmtDate(a.reviewedAt) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold">Commission & earnings by merchant</h2>
        <p className="text-xs text-[#0E3B24]/60">
          Rate in effect today for delivery orders, from <Link href="/admin/settings/pricing" className="underline">pricing settings</Link>.
          Earnings are from recorded order commissions. [DEV] = development sample, not a live partner.
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#F7F3EA] text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Merchant</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Rate in effect</th><th className="px-3 py-2">Orders</th><th className="px-3 py-2">Item sales</th>
                <th className="px-3 py-2">Duban commission</th><th className="px-3 py-2">Merchant net</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => {
                const cat = normalisePricingCategory(m.pricingCategory);
                const rate = commissionBps({
                  category: cat, overrideBps: m.commissionBps, isIndependent: m.isIndependent,
                  introRateStartedAt: m.introRateStartedAt, now, config,
                });
                const c = commByMerchant.get(m.id);
                return (
                  <tr key={m.id} className="border-t border-[#0E3B24]/8">
                    <td className="px-3 py-2">{m.isDevSample && <span className="mr-1 rounded bg-[#0E3B24] px-1 text-[10px] text-[#FFB627]">[DEV]</span>}{m.name}<span className="block text-xs text-[#0E3B24]/50">{m._count.products} products</span></td>
                    <td className="px-3 py-2">{m.status}</td>
                    <td className="px-3 py-2">{cat}{m.isIndependent ? " · indep." : ""}</td>
                    <td className="px-3 py-2"><b>{pct(rate.bps)}</b><span className="block text-xs text-[#0E3B24]/55">{REASON_LABEL[rate.reason] ?? rate.reason}{rate.reason === "INTRO_INDEPENDENT" && m.introRateStartedAt ? ` until ${fmtDate(introRateEndsAt(m.introRateStartedAt, config.introCommissionMonths))}` : ""}</span></td>
                    <td className="px-3 py-2">{c?._count ?? 0}</td>
                    <td className="px-3 py-2">{formatZar(c?._sum.orderTotalCents ?? 0)}</td>
                    <td className="px-3 py-2">{formatZar(c?._sum.commissionCents ?? 0)}</td>
                    <td className="px-3 py-2">{formatZar(c?._sum.netPayoutCents ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Courier payouts</h2>
        <p className="text-xs text-[#0E3B24]/60">Earnings per delivered order (base + distance + batch + peak + tips). No payouts are sent automatically.</p>
        {couriers.size === 0 ? (
          <p className="mt-2 text-sm text-[#0E3B24]/65">No courier earnings recorded yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#F7F3EA] text-xs uppercase">
                <tr><th className="px-3 py-2">Courier</th><th className="px-3 py-2">Deliveries</th><th className="px-3 py-2">Of which tips</th><th className="px-3 py-2">Owed (unsettled)</th><th className="px-3 py-2">Paid (settled)</th></tr>
              </thead>
              <tbody>
                {[...couriers.values()].map((c) => (
                  <tr key={c.name} className="border-t border-[#0E3B24]/8">
                    <td className="px-3 py-2">{c.dev && <span className="mr-1 rounded bg-[#0E3B24] px-1 text-[10px] text-[#FFB627]">[DEV]</span>}{c.name}</td>
                    <td className="px-3 py-2">{c.deliveries}</td>
                    <td className="px-3 py-2">{formatZar(c.tips)}</td>
                    <td className="px-3 py-2 font-semibold">{formatZar(c.unsettled)}</td>
                    <td className="px-3 py-2">{formatZar(c.settled)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
