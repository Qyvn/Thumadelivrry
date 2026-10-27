"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitGemAction, type GemFormState } from "../actions";
import { GEM_CATEGORIES } from "@/lib/onestop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initial: GemFormState = {};

export function SubmitGemForm() {
  const [state, action, pending] = useActionState(submitGemAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[#0E3B24]/10 bg-white p-6 text-center">
        <p className="font-semibold text-lg">Thanks — gem submitted</p>
        <p className="mt-2 text-sm text-[#0E3B24]/65">
          An admin will review it before it appears publicly. We never invent places.
        </p>
        <Link href="/gems" className="mt-4 inline-block text-sm font-semibold underline">
          Back to Hidden Gems
        </Link>
      </div>
    );
  }

  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>
      )}
      <Field label="Spot name" error={err("name")}>
        <Input name="name" required maxLength={120} placeholder="e.g. local name only — no fiction" />
      </Field>
      <Field label="Category" error={err("category")}>
        <select name="category" required className="w-full rounded-xl border border-[#0E3B24]/15 px-3 py-2 text-sm">
          <option value="">Select…</option>
          {GEM_CATEGORIES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Area / suburb" error={err("area")}>
          <Input name="area" required placeholder="Umhlanga, Berea…" />
        </Field>
        <Field label="City" error={err("city")}>
          <Input name="city" defaultValue="Durban" />
        </Field>
      </div>
      <Field label="Description" error={err("description")}>
        <Textarea name="description" required rows={5} placeholder="What makes it special? Be accurate." />
      </Field>
      <Field label="Address hint (optional)" error={err("addressHint")}>
        <Input name="addressHint" placeholder="Approximate — do not invent a street address" />
      </Field>
      <Field label="Local tip (optional)" error={err("tipNote")}>
        <Textarea name="tipNote" rows={2} />
      </Field>
      <Field label="Your name" error={err("submitterName")}>
        <Input name="submitterName" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" error={err("submitterPhone")}>
          <Input name="submitterPhone" />
        </Field>
        <Field label="Email (optional)" error={err("submitterEmail")}>
          <Input name="submitterEmail" type="email" />
        </Field>
      </div>
      <p className="text-xs text-[#0E3B24]/55">
        Submissions are reviewed before publishing. Fake or copied listings will be rejected.
      </p>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Submit for review"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs font-normal text-red-700">{error}</span>}
    </label>
  );
}
