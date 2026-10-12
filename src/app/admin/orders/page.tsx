import Link from "next/link";
import {
  adminAssignCourierAction,
  adminRefundAction,
} from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { statusLabel } from "@/lib/order-lifecycle";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireUser(["ADMIN", "SUPPORT"]);

  const [orders, couriers] = await Promise.all([
    prisma.order.findMany({
      include: {
        merchant: true,
        payment: true,
        delivery: true,
        customer: { include: { user: true } },
        zone: true,
      },
      orderBy: { placedAt: "desc" },
      take: 50,
    }),
    prisma.courierProfile.findMany({
      where: { status: "APPROVED" },
      include: { user: true },
    }),
  ]);

  return (
    <div className="min-h-full bg-[#F5F0E6]">
      <header className="border-b border-[#18221B]/10 bg-[#18221B] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#D0F27B]">
            Order monitor
          </p>
          <Link href="/admin" className="text-sm text-[#D0F27B]">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="space-y-4">
          {orders.length === 0 && (
            <p className="text-sm text-[#18221B]/65">No orders yet.</p>
          )}
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-[#18221B]/8 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-[#18221B]/65">
                    {order.merchant.name} · {order.zone.name} ·{" "}
                    {order.customer.user.fullName}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {statusLabel(order.status)}
                  </p>
                  <p className="text-xs text-[#18221B]/45">
                    Payment: {order.payment?.status ?? "n/a"}
                  </p>
                </div>
                <p className="font-bold">{formatZar(order.totalCents)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(order.status === "READY_FOR_COLLECTION" ||
                  order.status === "DELIVERY_FAILED") &&
                  couriers.length > 0 && (
                    <form
                      action={adminAssignCourierAction}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="orderId" value={order.id} />
                      <select
                        name="courierId"
                        className="h-9 rounded-lg border border-[#18221B]/15 bg-white px-2 text-sm"
                        defaultValue={couriers[0].id}
                      >
                        {couriers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.user.fullName}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm">
                        Assign courier
                      </Button>
                    </form>
                  )}

                {order.payment?.status === "CAPTURED" &&
                  ["CANCELLED", "REJECTED", "REFUND_PENDING", "DELIVERY_FAILED"].includes(
                    order.status,
                  ) && (
                    <form action={adminRefundAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input
                        type="hidden"
                        name="reason"
                        value="Authorised admin refund"
                      />
                      <Button type="submit" size="sm" variant="outline">
                        Process refund
                      </Button>
                    </form>
                  )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
