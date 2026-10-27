"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitHomeAction, type HomeFormState } from "../actions";
import {
  COMMON_AMENITIES,
  HOME_PROPERTY_TYPES,
  listingTypeForProperty,
  type HomePropertyType,
} from "@/lib/onestop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initial: HomeFormState = {};

export function ListHomeForm() {
  const [state, action, pending] = useActionState(submitHomeAction, initial);
  const [propertyType, setPropertyType] = useState<HomePropertyType>("HOLIDAY_HOME");
  const listingType = listingTypeForProperty(propertyType);
  const isHotel = propertyType === "HOTEL";

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-center">
        <p className="text-lg font-semibold">Stay submitted</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          An admin will review your stay before it appears. Guests enquire via
          WhatsApp — Duban does not take payments or deposits.
        </p>
        <Link
          href="/stays"
          className="mt-4 inline-block text-sm font-medium text-[var(--muted)] underline underline-offset-4"
        >
          Back to Stays
        </Link>
      </div>
    );
  }

  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>
      )}

      <Field label="Title" error={err("title")}>
        <Input name="title" required maxLength={140} placeholder="Honest title — no invented claims" />
      </Field>
      <Field label="Description" error={err("description")}>
        <Textarea name="description" required rows={5} placeholder="Describe the real space, location and house rules." />
      </Field>

      <fieldset>
        <legend className="text-xs font-semibold">Stay type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {HOME_PROPERTY_TYPES.map((t) => (
            <label
              key={t.code}
              className={`inline-flex cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                propertyType === t.code
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                  : "border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              <input
                type="radio"
                name="propertyType"
                value={t.code}
                checked={propertyType === t.code}
                onChange={() => setPropertyType(t.code)}
                className="sr-only"
                required
              />
              {t.label}
            </label>
          ))}
        </div>
        {err("propertyType") && (
          <span className="mt-1 block text-xs font-normal text-red-700">{err("propertyType")}</span>
        )}
      </fieldset>

      {isHotel && (
        <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <Field label="Room types note" error={err("hotelRoomTypesNote")}>
            <Textarea
              name="hotelRoomTypesNote"
              required
              rows={3}
              placeholder="e.g. Standard twin, sea-view suite, family room"
            />
          </Field>
          <Field label="Website (optional)" error={err("websiteUrl")}>
            <Input name="websiteUrl" type="url" placeholder="https://" />
          </Field>
        </div>
      )}
      {!isHotel && (
        <>
          <input type="hidden" name="hotelRoomTypesNote" value="" />
          <input type="hidden" name="websiteUrl" value="" />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Area / suburb" error={err("area")}>
          <Input name="area" required placeholder="e.g. Durban North" />
        </Field>
        <Field label="City" error={err("city")}>
          <Input name="city" defaultValue="Durban" />
        </Field>
      </div>
      <Field label="Address hint (optional, approximate)" error={err("addressHint")}>
        <Input name="addressHint" placeholder="Do not invent a full street address" />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Bedrooms" error={err("bedrooms")}>
          <Input name="bedrooms" type="number" min={0} max={20} defaultValue={1} required />
        </Field>
        <Field label="Bathrooms" error={err("bathrooms")}>
          <Input name="bathrooms" type="number" min={1} max={20} defaultValue={1} required />
        </Field>
        <Field label="Beds" error={err("beds")}>
          <Input name="beds" type="number" min={0} max={40} />
        </Field>
        <Field label="Max guests" error={err("maxGuests")}>
          <Input name="maxGuests" type="number" min={1} max={40} />
        </Field>
      </div>

      {listingType === "SHORT_STAY" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nightly price (R)" error={err("nightlyPriceRand")}>
            <Input name="nightlyPriceRand" required placeholder="e.g. 850" />
          </Field>
          <Field label="Min nights" error={err("minNights")}>
            <Input name="minNights" type="number" min={1} max={90} defaultValue={1} />
          </Field>
          <Field label="Check-in from" error={err("checkInFrom")}>
            <Input name="checkInFrom" placeholder="14:00" />
          </Field>
          <Field label="Check-out by" error={err("checkOutBy")}>
            <Input name="checkOutBy" placeholder="10:00" />
          </Field>
          <input type="hidden" name="monthlyPriceRand" value="" />
        </div>
      ) : (
        <div>
          <Field label="Monthly rent (R)" error={err("monthlyPriceRand")}>
            <Input name="monthlyPriceRand" required placeholder="e.g. 9500" />
          </Field>
          <input type="hidden" name="nightlyPriceRand" value="" />
        </div>
      )}

      <fieldset>
        <legend className="text-xs font-semibold">Amenities</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMON_AMENITIES.map((a) => (
            <label
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs"
            >
              <input type="checkbox" name="amenities" value={a} className="accent-[var(--ink)]" />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <h3 className="pt-2 font-semibold">Host</h3>
      <Field label="Host name" error={err("hostName")}>
        <Input name="hostName" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Host phone (WhatsApp)" error={err("hostPhone")}>
          <Input name="hostPhone" required placeholder="082…" />
        </Field>
        <Field label="Host email (optional)" error={err("hostEmail")}>
          <Input name="hostEmail" type="email" />
        </Field>
      </div>
      <Field label="Host bio (optional)" error={err("hostBio")}>
        <Textarea name="hostBio" rows={2} />
      </Field>

      <p className="text-xs text-[var(--muted)]">
        Listings are enquiry-only — no payments through Duban. Fake listings will be rejected.
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
