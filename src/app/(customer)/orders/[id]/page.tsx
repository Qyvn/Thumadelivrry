import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { Button } from "@/components/ui/button";
import { cancelOrderAction } from "@/app/actions/orders";
import { requireUser } from "@/lib/auth";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_VISIBLE_STEPS,
  statusLabel,
} from "@/lib/order-lifecycle";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const { basketCount, locationLabel, customerId } = await getCustomerShell();
  if (!customerId && user.role === "CUSTOMER") redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      merchant: true,
      address: true,
      payment: true,
      events: { orderBy: { createdAt: "asc" } },
      delivery: { include: { courier: { include: { user: true } } } },
    },
  });

  if (!order) notFound();
  if (user.role === "CUSTOMER" && order.customerId !== customerId) {
    notFound();
  }

  const canCancel = [
    "SUBMITTED",
    "MERCHANT_PENDING",
    "PAYMENT_PENDING",
  ].includes(order.status);

  const stepIndex = CUSTOMER_VISIBLE_STEPS.indexOf(
    order.status as (typeof CUSTOMER_VISIBLE_STEPS)[number],
  );

  return (
    <div className="min-h-full">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/orders" className="text-sm font-medium underline">
          All orders
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
          {order.orderNumber}
        </h1>
        <p className="mt-1 text-[#18221B]/65">{order.merchant.name}</p>
        <p className="mt-3 text-lg font-semibold">
          {statusLabel(order.status)}
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {stepIndex >= 0 && (
          <ol className="mt-6 space-y-2">
            {CUSTOMER_VISIBLE_STEPS.map((step, i) => (
              <li
                key={step}
                className={`flex items-center gap-3 text-sm ${
                  i <= stepIndex ? "font-semibold text-[#18221B]" : "text-[#18221B]/40"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    i <= stepIndex ? "bg-[#D0F27B]" : "bg-[#18221B]/15"
                  }`}
                />
                {statusLabel(step)}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-8 space-y-3 rounded-2xl border border-[#18221B]/8 bg-white p-5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span className="font-medium">
                {formatZar(item.lineTotalCents)}
              </span>
            </div>
          ))}
          <div className="border-t border-[#18221B]/10 pt-3 text-sm">
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{formatZar(order.deliveryFeeCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>{formatZar(order.serviceFeeCents)}</span>
            </div>
            <div className="mt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatZar(order.totalCents)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 text-sm">
          <p className="font-semibold">Delivery</p>
          <p className="mt-1 text-[#18221B]/65">
            {[
              order.address.building,
              order.address.unitNumber
                ? `Unit ${order.address.unitNumber}`
                : null,
              order.address.line1,
              order.address.suburb,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-3 text-xs text-[#18221B]/45">
            Estimated arrival is shown only when the system can calculate a
            reliable time — none is invented here.
          </p>
          <p className="mt-3 font-semibold">Payment</p>
          <p className="mt-1 text-[#18221B]/65">
            {order.payment?.status ?? "Not started"} ·{" "}
            {order.payment?.provider ?? "n/a"}
          </p>
          {order.delivery?.courier && (
            <>
              <p className="mt-3 font-semibold">Delivery partner</p>
              <p className="mt-1 text-[#18221B]/65">
                Assigned for this delivery. Live map tracking is not shown
                without real location data.
              </p>
            </>
          )}
          <p className="mt-3 font-semibold">Support</p>
          <p className="mt-1 text-[#18221B]/65">
            Need help with a missing, incorrect or delayed order? Contact THUMA
            support via your account once support channels are enabled.
          </p>
        </div>

        {canCancel && (
          <form action={cancelOrderAction} className="mt-6">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="reason" value="Customer cancelled" />
            <Button type="submit" variant="outline" className="w-full">
              Cancel order
            </Button>
          </form>
        )}

        <div className="mt-8">
          <p className="text-sm font-semibold">Timeline</p>
          <ul className="mt-3 space-y-2">
            {order.events.map((ev) => (
              <li key={ev.id} className="text-sm text-[#18221B]/65">
                {statusLabel(ev.toStatus)}
                {ev.note ? ` — ${ev.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
