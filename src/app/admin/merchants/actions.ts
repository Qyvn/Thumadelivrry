"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { approveApplication, rejectApplication } from "@/lib/merchant-onboarding";

export async function reviewApplicationAction(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 1000);
  let msg: string;
  try {
    if (decision === "approve") {
      const m = await approveApplication({ applicationId, adminId: admin.id, notes });
      msg = `saved=${encodeURIComponent(`Approved ${m.name}`)}`;
    } else if (decision === "reject") {
      await rejectApplication({ applicationId, adminId: admin.id, notes });
      msg = `saved=${encodeURIComponent("Application rejected")}`;
    } else throw new Error("Unknown decision");
  } catch (e) {
    msg = `error=${encodeURIComponent((e as Error).message)}`;
  }
  revalidatePath("/admin/merchants");
  revalidatePath("/admin");
  redirect(`/admin/merchants?${msg}`);
}
