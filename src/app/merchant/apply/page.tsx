import Link from "next/link";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sell on Duban — merchant application" };

export default function MerchantApplyPage() {
  return (
    <div className="thuma-hero-bg min-h-full px-4 py-10 text-[#0E3B24]">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#0E3B24]/8 bg-white/95 p-6 sm:p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold">Sell on Duban</p>
        <p className="text-xs text-[#0E3B24]/55">Duban Delivery, powered by THUMA</p>
        <h1 className="mt-3 text-xl font-semibold">Merchant application</h1>
        <p className="mt-2 text-sm text-[#0E3B24]/65">
          Restaurants, grocers and local shops in Greater Durban can apply. Every application is
          reviewed by a Duban admin; only approved merchants appear to customers.
        </p>
        <ApplyForm />
        <p className="mt-6 text-center text-xs text-[#0E3B24]/55">
          Already approved? <Link href="/login" className="underline">Log in</Link> to manage your catalogue.
        </p>
      </div>
    </div>
  );
}
