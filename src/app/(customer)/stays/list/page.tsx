import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { ListHomeForm } from "./list-form";

export const dynamic = "force-dynamic";

export default async function ListStayPage() {
  const { user, basketCount, locationLabel } = await getCustomerShell();
  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-16 pt-8">
        <Link href="/stays" className="text-sm text-[var(--muted)] underline underline-offset-4">
          ← Stays
        </Link>
        <h1 className="display mt-3 text-3xl text-[var(--ink)]">List your stay</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Hotels, guesthouses, B&amp;Bs, holiday homes or monthly rentals. Admin
          approval required. Guests enquire on WhatsApp — no payments on Duban.
        </p>
        <div className="mt-6">
          <ListHomeForm />
        </div>
      </main>
    </AppShell>
  );
}
