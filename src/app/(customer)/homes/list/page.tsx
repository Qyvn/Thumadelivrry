import Link from "next/link";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { getCustomerShell } from "@/lib/customer-context";
import { ListHomeForm } from "./list-form";

export const dynamic = "force-dynamic";

export default async function ListHomePage() {
  const { user, basketCount, locationLabel } = await getCustomerShell();
  return (
    <div className="flex min-h-full flex-col bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav user={user} basketCount={basketCount} locationLabel={locationLabel} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-5">
        <Link href="/homes" className="text-sm underline">← Homes</Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
          List your home
        </h1>
        <p className="mt-2 text-sm text-[#0E3B24]/65">
          Short stays or long-term rentals around Durban. Admin approval required. Guests enquire
          on WhatsApp — no payments collected by Duban.
        </p>
        <div className="mt-6">
          <ListHomeForm />
        </div>
      </main>
    </div>
  );
}
