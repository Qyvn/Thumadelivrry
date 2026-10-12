import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getCustomerShell } from "@/lib/customer-context";
import { isAddressInServiceArea } from "@/lib/eligibility";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function saveAddressAction(formData: FormData) {
  "use server";
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/login");

  const line1 = String(formData.get("line1") ?? "").trim();
  const suburb = String(formData.get("suburb") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || "Umhlanga";
  const label = String(formData.get("label") ?? "Home").trim() || "Home";
  const building = String(formData.get("building") ?? "").trim() || undefined;
  const unitNumber = String(formData.get("unitNumber") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "") || undefined;

  if (!line1 || !suburb) {
    redirect("/account/addresses?error=Address+line+and+suburb+required");
  }

  const zone = await prisma.deliveryZone.findUnique({
    where: { slug: "cornubia-flats" },
  });
  const inServiceArea = isAddressInServiceArea(
    { line1, suburb, city, building, unitNumber },
    zone?.boundaryJson,
  );

  await prisma.address.updateMany({
    where: { customerId: profile.id, isDefault: true },
    data: { isDefault: false },
  });

  const address = await prisma.address.create({
    data: {
      customerId: profile.id,
      label,
      line1,
      building,
      unitNumber,
      suburb,
      city,
      province: "KwaZulu-Natal",
      notes,
      isDefault: true,
      inServiceArea,
      latitude: inServiceArea ? -29.7005 : null,
      longitude: inServiceArea ? 31.0685 : null,
    },
  });

  await writeAudit({
    actorId: user.id,
    entityType: "USER",
    entityId: user.id,
    action: "ADDRESS_CREATED",
    detail: { addressId: address.id, inServiceArea },
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  const { basketCount, locationLabel, customerId } = await getCustomerShell();
  if (!customerId) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-full bg-[#F5F0E6]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Delivery addresses
        </h1>
        <p className="mt-2 text-sm text-[#18221B]/65">
          THUMA delivers to Cornubia Flats only for now. Include building/block
          and flat/unit so couriers can find you.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className="rounded-2xl border border-[#18221B]/8 bg-white p-4"
            >
              <p className="font-semibold">
                {addr.label}
                {addr.isDefault ? " · Default" : ""}
              </p>
              <p className="mt-1 text-sm text-[#18221B]/65">
                {[addr.building, addr.unitNumber ? `Unit ${addr.unitNumber}` : null, addr.line1]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-sm text-[#18221B]/65">
                {addr.suburb}, {addr.city}
              </p>
              <p
                className={`mt-2 text-xs font-semibold ${
                  addr.inServiceArea ? "text-emerald-800" : "text-red-700"
                }`}
              >
                {addr.inServiceArea
                  ? "Inside Cornubia Flats launch zone"
                  : "Outside current service area — checkout blocked"}
              </p>
            </li>
          ))}
          {addresses.length === 0 && (
            <li className="rounded-2xl border border-dashed border-[#18221B]/20 px-4 py-8 text-center text-sm text-[#18221B]/65">
              No saved addresses yet.
            </li>
          )}
        </ul>

        <form
          action={saveAddressAction}
          className="mt-8 space-y-3 rounded-2xl border border-[#18221B]/8 bg-white p-5"
        >
          <h2 className="font-semibold">Add address</h2>
          <Input name="label" placeholder="Label (Home, Work…)" defaultValue="Home" />
          <Input name="building" placeholder="Building or block" />
          <Input name="unitNumber" placeholder="Flat or unit number" />
          <Input
            name="line1"
            placeholder="Street / complex name"
            required
            defaultValue="Cornubia Flats"
          />
          <Input
            name="suburb"
            placeholder="Suburb"
            required
            defaultValue="Cornubia"
          />
          <Input name="city" placeholder="City" defaultValue="Umhlanga" />
          <Input name="notes" placeholder="Delivery notes (optional)" />
          <Button type="submit" className="w-full">
            Save address
          </Button>
        </form>
      </main>
    </div>
  );
}
