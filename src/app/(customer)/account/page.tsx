import Link from "next/link";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { getCustomerShell } from "@/lib/customer-context";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const { basketCount, locationLabel } = await getCustomerShell();

  return (
    <div className="min-h-full">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Account
        </h1>
        <div className="mt-6 rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
          <p className="font-semibold">{user.fullName}</p>
          <p className="text-sm text-[#0E3B24]/65">{user.email}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-[#0E3B24]/45">
            Role: {user.role}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href="/account/addresses"
            className="block rounded-xl border border-[#0E3B24]/8 bg-white px-4 py-3 text-sm font-medium"
          >
            Delivery addresses
          </Link>
          <Link
            href="/orders"
            className="block rounded-xl border border-[#0E3B24]/8 bg-white px-4 py-3 text-sm font-medium"
          >
            Order history
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="block rounded-xl border border-[#0E3B24]/8 bg-white px-4 py-3 text-sm font-medium"
            >
              Admin dashboard
            </Link>
          )}
          {user.role === "MERCHANT_STAFF" && (
            <Link
              href="/merchant"
              className="block rounded-xl border border-[#0E3B24]/8 bg-white px-4 py-3 text-sm font-medium"
            >
              Merchant portal
            </Link>
          )}
          {user.role === "COURIER" && (
            <Link
              href="/courier"
              className="block rounded-xl border border-[#0E3B24]/8 bg-white px-4 py-3 text-sm font-medium"
            >
              Courier app
            </Link>
          )}
        </div>

        <form action={logoutAction} className="mt-8">
          <Button type="submit" variant="outline" className="w-full">
            Log out
          </Button>
        </form>
      </main>
    </div>
  );
}
