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
import { createHash } from "crypto";
import { FeeBreakdown } from "@/components/fee-breakdown";
import { isAddressInServiceArea } from "@/lib/eligibility";
import { getOrCreateBasket } from "@/lib/orders";
import { loadPricingConfig, quoteForBasket } from "@/lib/pricing-server";
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
  const merchant = await prisma.merchant.findUnique({
    where: { id: basket.items[0].product.merchantId },
    include: { zone: true },
  });
  const itemTotalCents = basket.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPriceCents,
    0,
  );
  const config = await loadPricingConfig();
  // Deterministic idempotency key: same basket contents => same key (no Date.now in render)
  const idempotencyKey = `chk_${createHash("sha256")
    .update(
      `${customerId}|${basket.id}|${basket.items
        .map((i) => `${i.id}:${i.quantity}`)
        .sort()
        .join(",")}`,
    )
    .digest("hex")
    .slice(0, 32)}`;
  const addressed = addresses.map((a) => ({
    ...a,
    inServiceArea: isAddressInServiceArea(
      {
        line1: a.line1,
        suburb: a.suburb,
        city: a.city,
        building: a.building,
        unitNumber: a.unitNumber,
        latitude: a.latitude,
        longitude: a.longitude,
      },
      zone?.boundaryJson,
    ),
  }));
  const eligibleAddresses = addressed.filter((a) => a.inServiceArea);
  const quoteAddress =
    eligibleAddresses.find((a) => a.isDefault) ?? eligibleAddresses[0] ?? null;
  const quotes = new Map<string, Awaited<ReturnType<typeof quoteForBasket>>["quote"]>();
  for (const a of eligibleAddresses) {
    const { quote } = await quoteForBasket({
      customerId,
      itemTotalCents,
      merchant,
      address: a,
      zoneBoundaryJson: zone?.boundaryJson,
      config,
    });
    quotes.set(a.id, quote);
  }
  const { quote: fallbackQuote } = await quoteForBasket({
    customerId,
    itemTotalCents,
    merchant,
    address: null,
    zoneBoundaryJson: zone?.boundaryJson,
    config,
  });
  const quote = (quoteAddress && quotes.get(quoteAddress.id)) || fallbackQuote;

  if (!quote.meetsMinimum) {
    redirect(
      `/basket?error=${encodeURIComponent(
        `Minimum order for this shop is ${formatZar(quote.minOrderCents)}. Add ${formatZar(quote.shortfallCents)} more in items.`,
      )}`,
    );
  }

  return (
    <div className="min-h-full bg-[#F7F3EA]">
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
        <p className="mt-2 text-sm text-[#0E3B24]/65">
          Delivery is available anywhere within the administrator-configured
          Greater Durban radius. Full price is shown before you pay. Payment uses
          a mock SA provider until live credentials are configured.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {addressed.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#0E3B24]/20 bg-white px-5 py-10 text-center">
            <p className="font-medium">Add a Durban delivery address</p>
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
              No eligible address inside the Durban delivery radius
            </p>
            <p className="mt-2 text-sm text-red-800/80">
              Checkout is blocked for destinations outside the configured radius.
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
              {addressed.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    addr.inServiceArea
                      ? "border-[#0E3B24]/10 bg-white"
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
                    <span className="block text-sm text-[#0E3B24]/60">
                      {addr.line1}, {addr.suburb}, {addr.city}
                    </span>
                    {quotes.get(addr.id) && (
                      <span className="mt-1 block text-xs text-[#0E3B24]/60">
                        {quotes.get(addr.id)!.distanceKm.toFixed(1)} km · delivery{" "}
                        {quotes.get(addr.id)!.deliveryFeeCents === 0
                          ? "free"
                          : formatZar(quotes.get(addr.id)!.deliveryFeeCents)}
                      </span>
                    )}
                    {!addr.inServiceArea && (
                      <span className="mt-1 block text-xs font-semibold text-red-700">
                        Outside Durban delivery radius — cannot checkout
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

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">
                Courier tip (optional · 100% goes to your courier)
              </legend>
              <div className="flex flex-wrap gap-2">
                {[0, 5, 10, 20].map((r) => (
                  <label
                    key={r}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#0E3B24]/10 bg-white px-3 py-2 text-sm"
                  >
                    <input type="radio" name="tipRand" value={r} defaultChecked={r === 0} />
                    {r === 0 ? "No tip" : `R${r}`}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <h2 className="mb-2 text-sm font-semibold">Fee breakdown</h2>
              <FeeBreakdown
                {...quote}
                totalLabel="Total due (before tip)"
              />
              <p className="mt-2 text-xs text-[#0E3B24]/55">
                Quoted for {quoteAddress ? `“${quoteAddress.label}”` : "your area"}. Fees are
                recalculated on the server for the address you select; any tip is
                added on top and passed in full to the courier.
              </p>
            </div>

            <div className="rounded-2xl border border-[#0E3B24]/10 bg-[#efe6d2]/50 p-4 text-sm">
              <p className="font-semibold">Mock payment (development)</p>
              <p className="mt-1 text-[#0E3B24]/65">
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
              Place order · {formatZar(quote.totalCents)} + tip
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
