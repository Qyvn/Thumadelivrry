"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HOUR_DAYS, MERCHANT_CATEGORIES } from "@/lib/onboarding";
import { applyAction, type ApplyState } from "./actions";
import { MapPin } from "./map-pin";

const DAY_NAMES: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <span className="mt-1 block">{children}</span>
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyAction, {});
  const fe = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="mt-6 rounded-xl bg-[#FFB627]/40 px-4 py-4 text-sm" role="status">
        <p className="font-semibold">Application submitted for review.</p>
        <p className="mt-1">
          A Duban admin will review it. Once approved you can log in with your email and password to
          set up your menu or catalogue. You will not appear to customers until you are approved and
          have added products.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{state.error}</p>
      )}
      <Field label="Business name *" error={fe.businessName}>
        <Input name="businessName" required maxLength={120} />
      </Field>
      <Field label="Owner name *" error={fe.ownerName}>
        <Input name="ownerName" required maxLength={120} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact phone *" error={fe.contactPhone}>
          <Input name="contactPhone" type="tel" placeholder="082 123 4567" required />
        </Field>
        <Field label="WhatsApp (if different)" error={fe.whatsappPhone}>
          <Input name="whatsappPhone" type="tel" placeholder="082 123 4567" />
        </Field>
      </div>
      <Field label="Email (your login) *" error={fe.contactEmail}>
        <Input name="contactEmail" type="email" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password *" error={fe.password}>
          <Input name="password" type="password" minLength={8} required autoComplete="new-password" />
        </Field>
        <Field label="Confirm password *" error={fe.passwordConfirm}>
          <Input name="passwordConfirm" type="password" minLength={8} required autoComplete="new-password" />
        </Field>
      </div>
      <Field label="Category *" error={fe.pricingCategory}>
        <select
          name="pricingCategory"
          defaultValue=""
          required
          className="flex h-11 w-full rounded-xl border border-[#0E3B24]/15 bg-white px-4 text-sm"
        >
          <option value="" disabled>Choose…</option>
          {MERCHANT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </Field>
      <fieldset className="text-sm">
        <legend className="font-medium">Independent business (not a chain or franchise)? *</legend>
        <div className="mt-1 flex gap-6">
          <label className="flex items-center gap-2"><input type="radio" name="isIndependent" value="yes" /> Yes</label>
          <label className="flex items-center gap-2"><input type="radio" name="isIndependent" value="no" /> No</label>
        </div>
        <p className="mt-1 text-xs text-[#0E3B24]/55">Independents get an introductory commission rate for their first months (see terms on approval).</p>
        {fe.isIndependent && <p className="mt-1 text-xs text-red-700">{fe.isIndependent}</p>}
      </fieldset>
      <Field label="Street address *" error={fe.addressLine1}>
        <Input name="addressLine1" required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suburb *" error={fe.suburb}>
          <Input name="suburb" required />
        </Field>
        <Field label="City *" error={fe.city}>
          <Input name="city" defaultValue="Durban" required />
        </Field>
      </div>
      <MapPin error={fe.latitude ?? fe.longitude} />
      <fieldset className="rounded-xl border border-[#0E3B24]/10 p-3 text-sm">
        <legend className="px-1 font-semibold">Opening hours *</legend>
        <div className="space-y-2">
          {HOUR_DAYS.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="w-10 font-medium">{DAY_NAMES[d]}</span>
              <input type="time" name={`hours_${d}_open`} defaultValue="08:00" aria-label={`${d} open`} className="h-9 rounded-lg border border-[#0E3B24]/15 px-2" />
              <span>–</span>
              <input type="time" name={`hours_${d}_close`} defaultValue="18:00" aria-label={`${d} close`} className="h-9 rounded-lg border border-[#0E3B24]/15 px-2" />
              <label className="ml-auto flex items-center gap-1 text-xs">
                <input type="checkbox" name={`hours_${d}_closed`} /> Closed
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      <Field label="Logo (optional, PNG/JPEG/WebP, max 300 KB)">
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
      </Field>
      <Field label="Anything else we should know?">
        <Textarea name="notes" maxLength={1000} />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
