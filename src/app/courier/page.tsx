import Link from "next/link";
import { courierOrderAction } from "@/app/actions/orders";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { statusLabel } from "@/lib/order-lifecycle";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CourierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireUser(["COURIER", "ADMIN"]);

  const courier = await prisma.courierProfile.findUnique({
    where: { userId: user.id },
  });

  const available = await prisma.order.findMany({
    where: {
      status: "READY_FOR_COLLECTION",
      OR: [
        { delivery: null },
        { delivery: { courierId: null, status: "OFFERED" } },
      ],
    },
    include: {
      merchant: true,
      address: true,
      delivery: true,
    },
    orderBy: { readyAt: "asc" },
  });

  const mine = courier
    ? await prisma.order.findMany({
        where: {
          delivery: { courierId: courier.id },
          status: {
            in: ["COURIER_ASSIGNED", "COLLECTED", "IN_TRANSIT"],
          },
        },
        include: {
          merchant: true,
          address: true,
          delivery: true,
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const completed = courier
    ? await prisma.courierEarning.findMany({
        where: { courierId: courier.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="min-h-full bg-[#F5F0E6]">
      <header className="border-b border-[#18221B]/10 bg-[#18221B] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#D0F27B]">
              THUMA Courier
            </p>
            <p className="text-sm text-white/70">{user.fullName}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" size="sm" variant="outline" className="border-[#D0F27B]/40 text-[#D0F27B]">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!courier && (
          <div className="rounded-2xl border border-dashed border-[#18221B]/20 bg-white p-6 text-center">
            <p className="font-semibold">No courier profile</p>
            <p className="mt-2 text-sm text-[#18221B]/65">
              Ask an admin to approve your courier onboarding.
            </p>
            <Link href="/" className="mt-4 inline-block text-sm underline">
              Back home
            </Link>
          </div>
        )}

        {courier?.isDevSample && (
          <p className="rounded-xl bg-[#18221B] px-4 py-2 text-xs text-[#D0F27B]">
            Development sample courier profile.
          </p>
        )}

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Available jobs
          </h2>
          <p className="mt-1 text-sm text-[#18221B]/65">
            Customer contact details are limited to what you need for assigned
            deliveries.
          </p>
          {available.length === 0 ? (
            <p className="mt-3 text-sm text-[#18221B]/65">No open assignments.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {available.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#18221B]/8 bg-white p-4"
                >
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-[#18221B]/65">
                    Pickup: {order.merchant.name}
                    {order.merchant.addressLine1
                      ? ` · ${order.merchant.addressLine1}`
                      : ""}
                  </p>
                  <p className="text-sm text-[#18221B]/65">
                    Drop-off suburb: {order.address.suburb}
                  </p>
                  <form action={courierOrderAction} className="mt-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="action" value="claim" />
                    <Button type="submit" size="sm">
                      Accept assignment
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            My deliveries
          </h2>
          {mine.length === 0 ? (
            <p className="mt-3 text-sm text-[#18221B]/65">No active deliveries.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {mine.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#18221B]/8 bg-white p-4"
                >
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm">{statusLabel(order.status)}</p>
                  <p className="mt-2 text-sm text-[#18221B]/65">
                    Pickup: {order.merchant.name}
                  </p>
                  <p className="text-sm text-[#18221B]/65">
                    Deliver to: {order.address.line1}, {order.address.suburb}
                  </p>
                  {order.address.notes && (
                    <p className="mt-1 text-xs text-[#18221B]/50">
                      Notes: {order.address.notes}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.status === "COURIER_ASSIGNED" && (
                      <form action={courierOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="action" value="collect" />
                        <Button type="submit" size="sm">
                          Confirm pickup
                        </Button>
                      </form>
                    )}
                    {order.status === "IN_TRANSIT" && (
                      <form action={courierOrderAction} className="flex w-full flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="action" value="deliver" />
                        <Input
                          name="proof"
                          placeholder="Proof of delivery note"
                          defaultValue="Handed to customer"
                          className="flex-1"
                        />
                        <Button type="submit" size="sm">
                          Mark delivered
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Earnings
          </h2>
          {completed.length === 0 ? (
            <p className="mt-3 text-sm text-[#18221B]/65">
              No completed delivery earnings yet. Rates are configurable platform
              policy.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {completed.map((e) => (
                <li
                  key={e.id}
                  className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm"
                >
                  <span>Order earning</span>
                  <span className="font-semibold">{formatZar(e.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
