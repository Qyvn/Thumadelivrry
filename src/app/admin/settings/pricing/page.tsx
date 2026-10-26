import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatZar } from "@/lib/utils";
import { deliveryFeeForDistance } from "@/lib/pricing";
import { PRICING_SECTIONS, toDisplay } from "@/lib/pricing-fields";
import { loadPricingConfig } from "@/lib/pricing-server";
import { updatePricingAction } from "./actions";

export const dynamic = "force-dynamic";

const UNIT_SUFFIX = { rand: "R", percent: "%", km: "km", months: "months", toggle: "" } as const;

export default async function PricingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  await requireUser(["ADMIN"]);
  const config = await loadPricingConfig();
  const examples = [2, 5, 8, 12, 20];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 text-[#0E3B24]">
      <Link href="/admin" className="text-sm underline">
        ← Admin dashboard
      </Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold">
        Pricing settings
      </h1>
      <p className="mt-2 text-sm text-[#0E3B24]/65">
        All customer fees, merchant commission, courier pay and THUMA Plus rules are read from
        these settings at checkout. Changes apply to new orders only; placed orders keep their
        price snapshot.
      </p>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {saved && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Pricing saved.</p>
      )}

      <div className="mt-4 rounded-2xl bg-white p-4 text-sm">
        <p className="font-semibold">Current delivery fee preview</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((km) => (
            <span key={km} className="rounded-lg bg-[#F7F3EA] px-2 py-1">
              {km} km → {formatZar(deliveryFeeForDistance(km, config))}
            </span>
          ))}
        </div>
      </div>

      <form action={updatePricingAction} className="mt-6 space-y-6">
        {PRICING_SECTIONS.map((section) => (
          <fieldset key={section.title} className="rounded-2xl bg-white p-5">
            <legend className="px-1 text-lg font-bold">{section.title}</legend>
            <p className="text-xs text-[#0E3B24]/60">{section.description}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {section.fields.map((f) =>
                f.unit === "toggle" ? (
                  <label key={f.key} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name={f.key}
                      defaultChecked={Boolean(config[f.key])}
                      className="h-5 w-5"
                    />
                    <span>
                      <span className="font-medium">{f.label}</span>
                      {f.help && <span className="block text-xs text-[#0E3B24]/55">{f.help}</span>}
                    </span>
                  </label>
                ) : (
                  <label key={f.key} className="block text-sm">
                    <span className="font-medium">{f.label}</span>
                    <span className="mt-1 flex items-center gap-2">
                      {f.unit === "rand" && <span className="text-[#0E3B24]/60">R</span>}
                      <input
                        type="number"
                        name={f.key}
                        min={0}
                        step={f.unit === "months" ? 1 : 0.01}
                        required
                        defaultValue={toDisplay(f.unit, config[f.key] as number)}
                        className="h-10 w-full rounded-xl border border-[#0E3B24]/15 px-3"
                      />
                      {f.unit !== "rand" && (
                        <span className="text-[#0E3B24]/60">{UNIT_SUFFIX[f.unit]}</span>
                      )}
                    </span>
                  </label>
                ),
              )}
            </div>
          </fieldset>
        ))}
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Save pricing
        </Button>
      </form>
    </main>
  );
}
