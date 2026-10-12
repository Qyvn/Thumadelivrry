import Link from "next/link";
import { merchantOrderAction } from "@/app/actions/orders";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { statusLabel } from "@/lib/order-lifecycle";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MerchantPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireUser(["MERCHANT_STAFF", "ADMIN"]);

  const staff = await prisma.merchantStaff.findFirst({
    where: { userId: user.id },
    include: { merchant: true },
  });

  const merchantId =
    staff?.merchantId ??
    (
      await prisma.merchant.findFirst({
        where: { status: "APPROVED" },
      })
    )?.id;

  const merchant = merchantId
    ? await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          products: { orderBy: { sortOrder: "asc" } },
        },
      })
    : null;

  const orders = merchantId
    ? await prisma.order.findMany({
        where: { merchantId },
        include: { items: true, payment: true, customer: { include: { user: true } } },
        orderBy: { placedAt: "desc" },
        take: 40,
      })
    : [];

  const pending = orders.filter((o) => o.status === "MERCHANT_PENDING");
  const active = orders.filter((o) =>
    ["ACCEPTED", "PREPARING", "READY_FOR_COLLECTION", "COURIER_ASSIGNED", "COLLECTED", "IN_TRANSIT"].includes(
      o.status,
    ),
  );

  return (
    <div className="min-h-full bg-[#F5F0E6]">
      <header className="border-b border-[#18221B]/10 bg-[#18221B] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[#D0F27B]">
              THUMA Merchant
            </p>
            <p className="text-sm text-white/70">
              {merchant?.name ?? "No merchant linked"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-[#D0F27B]">
              Customer app
            </Link>
            <form action={logoutAction}>
              <Button type="submit" size="sm" variant="outline" className="border-[#D0F27B]/40 text-[#D0F27B]">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!merchant && (
          <div className="rounded-2xl border border-dashed border-[#18221B]/20 bg-white p-8 text-center">
            <p className="font-semibold">No merchant account linked</p>
            <p className="mt-2 text-sm text-[#18221B]/65">
              Apply to join THUMA or ask an admin to approve your application.
            </p>
            <Link href="/merchant/apply" className="mt-4 inline-block text-sm font-semibold underline">
              Apply to join
            </Link>
          </div>
        )}

        {merchant && (
          <>
            {merchant.isDevSample && (
              <p className="rounded-xl bg-[#18221B] px-4 py-2 text-xs text-[#D0F27B]">
                This merchant is DEVELOPMENT SAMPLE data — not a confirmed live partner.
              </p>
            )}

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                Incoming orders
              </h2>
              {pending.length === 0 ? (
                <p className="mt-3 text-sm text-[#18221B]/65">
                  No orders waiting for acceptance.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {pending.map((order) => (
                    <OrderCard key={order.id} order={order} mode="pending" />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                In progress
              </h2>
              {active.length === 0 ? (
                <p className="mt-3 text-sm text-[#18221B]/65">Nothing in the kitchen right now.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {active.map((order) => (
                    <OrderCard key={order.id} order={order} mode="active" />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                Catalogue
              </h2>
              <p className="mt-1 text-sm text-[#18221B]/65">
                {merchant.products.length} products · commission{" "}
                {(merchant.commissionBps / 100).toFixed(1)}% (configurable policy)
              </p>
              <ul className="mt-4 divide-y divide-[#18221B]/8 rounded-2xl border border-[#18221B]/8 bg-white">
                {merchant.products.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span>
                      {p.name}
                      {!p.isAvailable && (
                        <span className="ml-2 text-red-700">Unavailable</span>
                      )}
                    </span>
                    <span className="font-semibold">{formatZar(p.priceCents)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  order,
  mode,
}: {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    customerNotes: string | null;
    items: { quantity: number; name: string }[];
    payment: { status: string } | null;
    customer: { user: { fullName: string } };
  };
  mode: "pending" | "active";
}) {
  return (
    <div className="rounded-2xl border border-[#18221B]/8 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{order.orderNumber}</p>
          <p className="text-sm text-[#18221B]/60">
            {order.customer.user.fullName} · {statusLabel(order.status)}
          </p>
          <p className="mt-1 text-xs text-[#18221B]/45">
            Payment: {order.payment?.status ?? "n/a"}
          </p>
        </div>
        <p className="font-bold">{formatZar(order.totalCents)}</p>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((item, i) => (
          <li key={i}>
            {item.quantity}× {item.name}
          </li>
        ))}
      </ul>
      {order.customerNotes && (
        <p className="mt-2 text-sm text-[#18221B]/65">
          Note: {order.customerNotes}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {mode === "pending" && (
          <>
            <form action={merchantOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="action" value="accept" />
              <Button type="submit" size="sm">
                Accept
              </Button>
            </form>
            <form action={merchantOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="action" value="reject" />
              <input type="hidden" name="reason" value="Unable to fulfil" />
              <Button type="submit" size="sm" variant="outline">
                Reject
              </Button>
            </form>
          </>
        )}
        {mode === "active" && order.status === "PREPARING" && (
          <form action={merchantOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="action" value="ready" />
            <Button type="submit" size="sm">
              Mark ready for collection
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
