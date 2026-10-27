"use server";

import { prisma } from "@/lib/db";
import {
  homeSubmitSchema,
  listingTypeForProperty,
  parseRandToCents,
  uniqueSlug,
} from "@/lib/onestop";
import { revalidatePath } from "next/cache";

export type HomeFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitHomeAction(
  _prev: HomeFormState,
  formData: FormData,
): Promise<HomeFormState> {
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const amenities = formData
    .getAll("amenities")
    .filter((v): v is string => typeof v === "string");

  const parsed = homeSubmitSchema.safeParse({
    title: str("title"),
    description: str("description"),
    propertyType: str("propertyType"),
    area: str("area"),
    city: str("city") || "Durban",
    addressHint: str("addressHint"),
    bedrooms: str("bedrooms"),
    bathrooms: str("bathrooms"),
    beds: str("beds") || undefined,
    maxGuests: str("maxGuests") || undefined,
    nightlyPriceRand: str("nightlyPriceRand"),
    monthlyPriceRand: str("monthlyPriceRand"),
    minNights: str("minNights") || undefined,
    checkInFrom: str("checkInFrom"),
    checkOutBy: str("checkOutBy"),
    hotelRoomTypesNote: str("hotelRoomTypesNote"),
    websiteUrl: str("websiteUrl"),
    amenities,
    hostName: str("hostName"),
    hostPhone: str("hostPhone"),
    hostEmail: str("hostEmail"),
    hostBio: str("hostBio"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please fix the highlighted fields", fieldErrors };
  }
  const d = parsed.data;
  const listingType = listingTypeForProperty(d.propertyType);
  const nightly =
    listingType === "SHORT_STAY" ? parseRandToCents(d.nightlyPriceRand ?? "") : null;
  const monthly =
    listingType === "LONG_TERM" ? parseRandToCents(d.monthlyPriceRand ?? "") : null;

  await prisma.homeListing.create({
    data: {
      title: d.title,
      slug: uniqueSlug(d.title),
      description: d.description,
      listingType,
      propertyType: d.propertyType,
      area: d.area,
      city: d.city || "Durban",
      addressHint: d.addressHint || null,
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      beds: d.beds ?? null,
      maxGuests: d.maxGuests ?? null,
      nightlyPriceCents: nightly,
      monthlyPriceCents: monthly,
      minNights: d.minNights ?? null,
      checkInFrom: d.checkInFrom || null,
      checkOutBy: d.checkOutBy || null,
      hotelRoomTypesNote:
        d.propertyType === "HOTEL" ? d.hotelRoomTypesNote || null : null,
      websiteUrl: d.propertyType === "HOTEL" ? d.websiteUrl || null : null,
      amenitiesJson: JSON.stringify(d.amenities ?? []),
      photosJson: "[]",
      hostName: d.hostName,
      hostPhone: d.hostPhone,
      hostEmail: d.hostEmail || null,
      hostBio: d.hostBio || null,
      status: "PENDING_REVIEW",
    },
  });
  revalidatePath("/stays");
  revalidatePath("/admin/stays");
  return { ok: true };
}
