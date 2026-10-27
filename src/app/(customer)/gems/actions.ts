"use server";

import { prisma } from "@/lib/db";
import { gemSubmitSchema, uniqueSlug } from "@/lib/onestop";
import { revalidatePath } from "next/cache";

export type GemFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitGemAction(
  _prev: GemFormState,
  formData: FormData,
): Promise<GemFormState> {
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const parsed = gemSubmitSchema.safeParse({
    name: str("name"),
    description: str("description"),
    category: str("category"),
    area: str("area"),
    city: str("city") || "Durban",
    addressHint: str("addressHint"),
    tipNote: str("tipNote"),
    submitterName: str("submitterName"),
    submitterPhone: str("submitterPhone"),
    submitterEmail: str("submitterEmail"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please fix the highlighted fields", fieldErrors };
  }
  const d = parsed.data;
  await prisma.hiddenGem.create({
    data: {
      name: d.name,
      slug: uniqueSlug(d.name),
      description: d.description,
      category: d.category,
      area: d.area,
      city: d.city || "Durban",
      addressHint: d.addressHint || null,
      tipNote: d.tipNote || null,
      submitterName: d.submitterName,
      submitterPhone: d.submitterPhone || null,
      submitterEmail: d.submitterEmail || null,
      status: "PENDING_REVIEW",
    },
  });
  revalidatePath("/gems");
  revalidatePath("/admin/gems");
  return { ok: true };
}
