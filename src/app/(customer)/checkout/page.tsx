import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { checkoutAction } from "@/app/actions/basket";
import { requireUser } from "@/lib/auth";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { getOrCreateBasket, summariseBasket } from "@/lib/orders";
import { formatZar } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireUser(["CUSTOMER", "ADMIN"]);
  const { user, basketCount, locationLabel, customerId, zone } =
    await getCustomerShell();

  if (!customerId || !user) redirect("/login");

  const basket = await getOrCreateBasket(customerId);
  if (basket.items.length === 0) redirect("/basket");

  const addresses = await prisma.address.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  const deliveryFee =
    zone?.baseFeeCents ?? settings?.defaultDeliveryFeeCents ?? 2500;
  const serviceFee = settings?.serviceFeeCents ?? 500;
  const totals = summariseBasket(basket.items, deliveryFee, serviceFee);
  const idempotencyKey = `chk_${customerId}_${Date.now()}`;
  const eligibleAddresses = addresses.filter((a) => a.inServiceArea);

  return (
    <div className="min-h-full bg-[#F5F0E6]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-[#18221B]/65">
          Delivery is limited to the administrator-configured Cornubia Flats
          zone. Full price is shown before you pay. Payment uses a mock SA
          provider until live credentials are configured.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {addresses.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#18221B]/20 bg-white px-5 py-10 text-center">
            <p className="font-medium">Add a Cornubia Flats delivery address</p>
            <Link
              href="/account/addresses"
              className="mt-4 inline-block text-sm font-semibold underline"
            >
              Manage addresses
            </Link>
          </div>
        ) : eligibleAddresses.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-red-200 bg-red-50 px-5 py-10 text-center">
            <p className="font-medium text-red-900">
              No eligible address inside Cornubia Flats
            </p>
            <p className="mt-2 text-sm text-red-800/80">
              Checkout is blocked for destinations outside the launch zone.
            </p>
            <Link
              href="/account/addresses"
              className="mt-4 inline-block text-sm font-semibold underline"
            >
              Update address
            </Link>
          </div>
        ) : (
          <form action={checkoutAction} className="mt-6 space-y-6">
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Delivery address</legend>
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    addr.inServiceArea
                      ? "border-[#18221B]/10 bg-white"
                      : "border-red-200 bg-red-50/50 opacity-70"
                  }`}
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={addr.id}
                    defaultChecked={addr.isDefault && addr.inServiceArea}
                    required
                    disabled={!addr.inServiceArea}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">
                      {addr.label}
                      {addr.building ? ` · ${addr.building}` : ""}
                      {addr.unitNumber ? ` · Unit ${addr.unitNumber}` : ""}
                    </span>
                    <span className="block text-sm text-[#18221B]/60">
                      {addr.line1}, {addr.suburb}, {addr.city}
                    </span>
                    {!addr.inServiceArea && (
                      <span className="mt-1 block text-xs font-semibold text-red-700">
                        Outside Cornubia Flats service area — cannot checkout
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>

            <div>
              <label htmlFor="customerNotes" className="text-sm font-semibold">
                Delivery instructions
              </label>
              <Textarea
                id="customerNotes"
                name="customerNotes"
                className="mt-2"
                placeholder="Gate code, floor, allergies, substitution notes…"
              />
            </div>

            <div className="space-y-2 rounded-2xl bg-white p-5 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatZar(totals.itemTotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{formatZar(totals.deliveryFeeCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span>{formatZar(totals.serviceFeeCents)}</span>
              </div>
              <div className="flex justify-between border-t border-[#18221B]/10 pt-3 text-base font-bold">
                <span>Total due</span>
                <span>{formatZar(totals.totalCents)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#18221B]/10 bg-[#ebe4d4]/50 p-4 text-sm">
              <p className="font-semibold">Mock payment (development)</p>
              <p className="mt-1 text-[#18221B]/65">
                Provider: {settings?.paymentProvider ?? "mock_payfast"}. Never
                marks paid from a browser redirect alone. Cash on delivery is
                not enabled.
              </p>
              <label className="mt-3 flex items-center gap-2">
                <input
                  type="radio"
                  name="simulatePayment"
                  value="success"
                  defaultChecked
                />
                Simulate successful provider callback
              </label>
              <label className="mt-2 flex items-center gap-2">
                <input type="radio" name="simulatePayment" value="fail" />
                Simulate payment failure
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Place order · {formatZar(totals.totalCents)}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
