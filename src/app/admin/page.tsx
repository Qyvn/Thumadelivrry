import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import {
  approveMerchantAction,
  updateMinOrderAction,
  updateZoneRadiusAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseZoneGeo } from "@/lib/geo";
import { formatZar } from "@/lib/utils";
import { getLaunchZone } from "@/lib/zones";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireUser(["ADMIN", "SUPPORT"]);

  const [
    completedOrders,
    allOrders,
    merchants,
    couriers,
    pendingApps,
    zone,
    tickets,
    commissions,
    settings,
  ] = await Promise.all([
    prisma.order.findMany({ where: { status: "DELIVERED" } }),
    prisma.order.findMany(),
    prisma.merchant.findMany(),
    prisma.courierProfile.findMany(),
    prisma.merchantApplication.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
    }),
    getLaunchZone(),
    prisma.supportTicket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.merchantCommission.findMany(),
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const accepted = allOrders.filter((o) =>
    [
      "ACCEPTED",
      "PREPARING",
      "READY_FOR_COLLECTION",
      "COURIER_ASSIGNED",
      "COLLECTED",
      "IN_TRANSIT",
      "DELIVERED",
    ].includes(o.status),
  ).length;
  const rejectionCount = allOrders.filter((o) => o.status === "REJECTED").length;
  const acceptanceDenom = accepted + rejectionCount;
  const acceptanceRate =
    acceptanceDenom > 0 ? Math.round((accepted / acceptanceDenom) * 100) : null;

  const avgBasket =
    completedOrders.length > 0
      ? Math.round(
          completedOrders.reduce((s, o) => s + o.itemTotalCents, 0) /
            completedOrders.length,
        )
      : null;

  const cancelled = allOrders.filter((o) =>
    ["CANCELLED", "REFUNDED"].includes(o.status),
  ).length;
  const cancelRate =
    allOrders.length > 0
      ? Math.round((cancelled / allOrders.length) * 100)
      : null;

  const deliveredWithTimes = completedOrders.filter(
    (o) => o.deliveredAt && o.placedAt,
  );
  const avgDeliveryMins =
    deliveredWithTimes.length > 0
      ? Math.round(
          deliveredWithTimes.reduce(
            (s, o) =>
              s + (o.deliveredAt!.getTime() - o.placedAt.getTime()) / 60000,
            0,
          ) / deliveredWithTimes.length,
        )
      : null;

  const contribution = commissions.reduce((s, c) => s + c.commissionCents, 0);
  const merchantPending = allOrders.filter(
    (o) => o.status === "MERCHANT_PENDING",
  ).length;

  return (
    <div className="min-h-full bg-[#F5F0E6]">
      <header className="border-b border-[#18221B]/10 bg-[#18221B] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#D0F27B]">
              THUMA Admin
            </p>
            <p className="text-sm text-white/70">{user.fullName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/shops" className="text-sm text-[#D0F27B]">
              Shop backlog
            </Link>
            <Link href="/admin/orders" className="text-sm text-[#D0F27B]">
              Orders
            </Link>
            <Link href="/" className="text-sm text-white/70">
              Customer app
            </Link>
            <form action={logoutAction}>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="border-[#D0F27B]/40 text-[#D0F27B]"
              >
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Greater Durban operations
          </h1>
          <p className="mt-2 text-sm text-[#18221B]/65">
            Metrics focus on fulfilled orders and unit economics — not downloads
            or registrations alone. Delivery covers the configured Durban radius.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#18221B]/45">
            Zone: {zone?.name ?? "Not configured"} ·{" "}
            {zone?.isActive ? "Active (config)" : "Inactive"} · Base fee{" "}
            {zone ? formatZar(zone.baseFeeCents) : "—"} · Store radius{" "}
            {zone ? `${parseZoneGeo(zone.boundaryJson).radiusKm} km` : "—"}
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {zone && (
            <div className="rounded-2xl border border-[#18221B]/8 bg-white p-5">
              <h2 className="font-semibold">Durban delivery radius</h2>
              <p className="mt-1 text-sm text-[#18221B]/65">
                Customers can receive delivery and see approved stores within this
                distance of their pin (or the Durban zone centre). Raise this to
                open more of the metro — max 100 km.
              </p>
              <form
                action={updateZoneRadiusAction}
                className="mt-4 flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="zoneId" value={zone.id} />
                <div>
                  <label htmlFor="radiusKm" className="text-xs font-semibold">
                    Radius (km)
                  </label>
                  <Input
                    id="radiusKm"
                    name="radiusKm"
                    type="number"
                    min={0.1}
                    max={100}
                    step={0.1}
                    defaultValue={parseZoneGeo(zone.boundaryJson).radiusKm}
                    className="mt-1 w-36"
                    required
                  />
                </div>
                <Button type="submit" size="sm">
                  Save radius
                </Button>
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-[#18221B]/8 bg-white p-5">
            <h2 className="font-semibold">Minimum order for delivery</h2>
            <p className="mt-1 text-sm text-[#18221B]/65">
              THUMA does not deliver when the item subtotal is under this amount.
              Current: {formatZar(settings?.minOrderCents ?? 20000)}.
            </p>
            <form
              action={updateMinOrderAction}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <div>
                <label htmlFor="minOrderRand" className="text-xs font-semibold">
                  Minimum (R)
                </label>
                <Input
                  id="minOrderRand"
                  name="minOrderRand"
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  defaultValue={Math.round((settings?.minOrderCents ?? 20000) / 100)}
                  className="mt-1 w-36"
                  required
                />
              </div>
              <Button type="submit" size="sm">
                Save minimum
              </Button>
            </form>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Completed orders" value={String(completedOrders.length)} />
          <Metric
            label="Acceptance rate"
            value={acceptanceRate === null ? "—" : `${acceptanceRate}%`}
          />
          <Metric
            label="Avg basket value"
            value={avgBasket === null ? "—" : formatZar(avgBasket)}
          />
          <Metric
            label="Cancel / refund rate"
            value={cancelRate === null ? "—" : `${cancelRate}%`}
          />
          <Metric
            label="Avg delivery time"
            value={avgDeliveryMins === null ? "—" : `${avgDeliveryMins} min`}
          />
          <Metric label="Commission contribution" value={formatZar(contribution)} />
          <Metric label="Open support cases" value={String(tickets.length)} />
          <Metric label="Awaiting merchant" value={String(merchantPending)} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#18221B]/8 bg-white p-5">
            <h2 className="font-semibold">Merchant applications</h2>
            {pendingApps.length === 0 ? (
              <p className="mt-3 text-sm text-[#18221B]/65">
                No pending applications.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pendingApps.map((app) => (
                  <li key={app.id} className="text-sm">
                    <p className="font-medium">{app.businessName}</p>
                    <p className="text-[#18221B]/60">
                      {app.suburb} · {app.categoryCodes} · {app.contactEmail}
                    </p>
                    <form action={approveMerchantAction} className="mt-2">
                      <input
                        type="hidden"
                        name="applicationId"
                        value={app.id}
                      />
                      <Button type="submit" size="sm">
                        Approve merchant
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[#18221B]/8 bg-white p-5">
            <h2 className="font-semibold">Platform snapshot</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                Merchants: {merchants.length} (
                {merchants.filter((m) => m.status === "APPROVED").length}{" "}
                approved)
              </li>
              <li>
                Couriers: {couriers.length} (
                {couriers.filter((c) => c.status === "APPROVED").length}{" "}
                approved)
              </li>
              <li>Total orders recorded: {allOrders.length}</li>
              <li>
                Dev sample merchants:{" "}
                {merchants.filter((m) => m.isDevSample).length} (not live
                partners)
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold underline">
              <Link href="/admin/shops">Shop backlog (names, menus, stock)</Link>
              <Link href="/admin/orders">Monitor &amp; dispatch orders</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#18221B]/8 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#18221B]/45">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}
