"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function reviewGemAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "SUPPORT"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim() || null;
  if (!id || !["APPROVED", "REJECTED", "SUSPENDED"].includes(decision)) {
    redirect("/admin/gems?error=Invalid+review");
  }
  await prisma.hiddenGem.update({
    where: { id },
    data: {
      status: decision,
      reviewNotes,
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });
  revalidatePath("/gems");
  revalidatePath("/admin/gems");
  redirect(`/admin/gems?saved=${decision}`);
}
