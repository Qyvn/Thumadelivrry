import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { requireUser } from "@/lib/auth";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { statusLabel } from "@/lib/order-lifecycle";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const { basketCount, locationLabel, customerId } = await getCustomerShell();
  if (!customerId) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { customerId },
    include: { merchant: true, payment: true },
    orderBy: { placedAt: "desc" },
  });

  return (
    <div className="min-h-full">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Your orders
        </h1>

        {orders.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white/70 px-5 py-12 text-center">
            <p className="font-medium">No orders yet</p>
            <Link href="/eats" className="mt-4 inline-block text-sm font-semibold underline">
              Start browsing
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-2xl border border-[#0E3B24]/8 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-[#0E3B24]/60">
                        {order.merchant.name}
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {statusLabel(order.status)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">
                        {formatZar(order.totalCents)}
                      </p>
                      <p className="mt-1 text-[#0E3B24]/45">
                        {order.payment?.status ?? "NO_PAYMENT"}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
