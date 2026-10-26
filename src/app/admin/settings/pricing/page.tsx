import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { formatZar } from "@/lib/utils";
import { deliveryFeeForDistance } from "@/lib/pricing";
import { PRICING_SECTIONS, toDisplay } from "@/lib/pricing-fields";
import { loadPricingConfig } from "@/lib/pricing-server";
import { DAY_LABELS, describePeakWindow, isInPeakWindow } from "@/lib/peak";
import { isPeakActive } from "@/lib/pricing";
import { addPeakWindowAction, removePeakWindowAction, updatePricingAction } from "./actions";

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

      <section id="peak" className="mt-4 rounded-2xl bg-white p-5 text-sm">
        <h2 className="text-lg font-bold">Peak-fee schedule (Africa/Johannesburg)</h2>
        <p className="text-xs text-[#0E3B24]/60">
          When “Peak fee enabled” is on, the peak fee is charged only inside these windows. With no
          windows, it applies all day. Windows ending before they start run past midnight.
        </p>
        <p className="mt-2">
          Right now: peak fee is <b>{isPeakActive(config) ? "being charged" : "not charged"}</b>
          {config.peakWindows.length > 0 && !config.peakFeeEnabled && " (windows set, but peak fee is disabled)"}
          {config.peakWindows.length > 0 && config.peakFeeEnabled && isInPeakWindow(config.peakWindows, new Date()) && " (inside a window)"}.
        </p>
        <ul className="mt-3 space-y-2">
          {config.peakWindows.length === 0 && <li className="text-[#0E3B24]/60">No windows scheduled.</li>}
          {config.peakWindows.map((w, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-[#F7F3EA] px-3 py-2">
              <span>{describePeakWindow(w)}</span>
              <form action={removePeakWindowAction}>
                <input type="hidden" name="index" value={i} />
                <button type="submit" className="text-xs text-red-700 underline">Remove</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addPeakWindowAction} className="mt-4 flex flex-wrap items-end gap-3">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="text-xs font-medium">Days</legend>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <label key={d} className="flex items-center gap-1">
                <input type="checkbox" name="days" value={d} /> {DAY_LABELS[d]}
              </label>
            ))}
          </fieldset>
          <label className="text-xs">From<input type="time" name="start" required defaultValue="17:00" className="mt-1 block h-9 rounded-lg border border-[#0E3B24]/15 px-2" /></label>
          <label className="text-xs">To<input type="time" name="end" required defaultValue="20:00" className="mt-1 block h-9 rounded-lg border border-[#0E3B24]/15 px-2" /></label>
          <Button type="submit" size="sm" variant="outline">Add window</Button>
        </form>
      </section>

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
