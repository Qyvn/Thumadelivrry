import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { SubmitGemForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitGemPage() {
  const { user, basketCount, locationLabel } = await getCustomerShell();
  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-5">
        <Link href="/gems" className="text-sm underline">← Hidden Gems</Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
          Submit a gem
        </h1>
        <p className="mt-2 text-sm text-[#0E3B24]/65">
          Share a real Durban spot. Admin approval required before it appears publicly.
        </p>
        <div className="mt-6">
          <SubmitGemForm />
        </div>
      </main>
    </AppShell>
  );
}
