"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function reviewHomeAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "SUPPORT"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim() || null;
  if (!id || !["APPROVED", "REJECTED", "SUSPENDED"].includes(decision)) {
    redirect("/admin/homes?error=Invalid+review");
  }
  await prisma.homeListing.update({
    where: { id },
    data: {
      status: decision,
      reviewNotes,
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });
  revalidatePath("/homes");
  revalidatePath("/admin/homes");
  redirect(`/admin/homes?saved=${decision}`);
}
