"use server";

import { getCurrentUser } from "@/lib/auth";
import { submitApplication } from "@/lib/merchant-onboarding";
import { applicationSchema, imageToDataUrl, parseHoursForm } from "@/lib/onboarding";

export type ApplyState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function applyAction(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const parsed = applicationSchema.safeParse({
    businessName: str("businessName"),
    ownerName: str("ownerName"),
    contactPhone: str("contactPhone"),
    whatsappPhone: str("whatsappPhone"),
    contactEmail: str("contactEmail"),
    password: str("password"),
    pricingCategory: str("pricingCategory"),
    isIndependent: str("isIndependent"),
    addressLine1: str("addressLine1"),
    suburb: str("suburb"),
    city: str("city"),
    latitude: str("latitude") || undefined,
    longitude: str("longitude") || undefined,
    notes: str("notes"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please fix the highlighted fields", fieldErrors };
  }
  if (str("password") !== str("passwordConfirm")) {
    return { error: "Passwords do not match", fieldErrors: { passwordConfirm: "Passwords do not match" } };
  }
  try {
    const hours = parseHoursForm((k) => str(k) ?? null);
    let logoDataUrl: string | undefined;
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0) {
      logoDataUrl = imageToDataUrl(logo, Buffer.from(await logo.arrayBuffer()));
    }
    const user = await getCurrentUser();
    await submitApplication(parsed.data, { hours, logoDataUrl, actorId: user?.id });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { ok: true };
}
