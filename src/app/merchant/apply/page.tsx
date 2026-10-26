import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function applyAction(formData: FormData) {
  "use server";
  const businessName = String(formData.get("businessName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const categoryCodes = String(formData.get("categoryCodes") ?? "EATS");
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const suburb = String(formData.get("suburb") ?? "").trim();
  const city = String(formData.get("city") ?? "Umhlanga").trim();
  const notes = String(formData.get("notes") ?? "") || undefined;

  if (!businessName || !contactName || !contactEmail || !contactPhone || !addressLine1 || !suburb) {
    redirect("/merchant/apply?error=Please+complete+all+required+fields");
  }

  const app = await prisma.merchantApplication.create({
    data: {
      businessName,
      contactName,
      contactEmail,
      contactPhone,
      categoryCodes,
      addressLine1,
      suburb,
      city,
      notes,
      status: "PENDING_REVIEW",
    },
  });

  const user = await getCurrentUser();
  await writeAudit({
    actorId: user?.id,
    entityType: "MERCHANT",
    entityId: app.id,
    action: "MERCHANT_APPLICATION_SUBMITTED",
  });

  revalidatePath("/admin");
  redirect("/merchant/apply?submitted=1");
}

export default async function MerchantApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const { error, submitted } = await searchParams;

  return (
    <div className="thuma-hero-bg min-h-full px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-[#0E3B24]/8 bg-white/95 p-6 sm:p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Join THUMA
        </p>
        <h1 className="mt-1 text-xl font-semibold">Merchant application</h1>
        <p className="mt-2 text-sm text-[#0E3B24]/65">
          Applications are reviewed by THUMA administrators. Only approved
          merchants become publicly orderable.
        </p>

        {submitted && (
          <p className="mt-4 rounded-xl bg-[#FFB627]/40 px-4 py-3 text-sm font-medium">
            Application submitted for review. You will not appear in the
            customer app until an admin approves you.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!submitted && (
          <form action={applyAction} className="mt-6 space-y-3">
            <Input name="businessName" placeholder="Business name" required />
            <Input name="contactName" placeholder="Contact name" required />
            <Input name="contactEmail" type="email" placeholder="Email" required />
            <Input name="contactPhone" placeholder="Phone" required />
            <select
              name="categoryCodes"
              className="flex h-11 w-full rounded-xl border border-[#0E3B24]/15 bg-white px-4 text-sm"
              defaultValue="EATS"
            >
              <option value="EATS">THUMA Eats (food)</option>
              <option value="MARKET">THUMA Market (essentials)</option>
              <option value="EATS,MARKET">Both Eats & Market</option>
            </select>
            <Input name="addressLine1" placeholder="Business address" required />
            <Input name="suburb" placeholder="Suburb" defaultValue="Durban" required />
            <Input name="city" placeholder="City" defaultValue="Umhlanga" />
            <Textarea name="notes" placeholder="Tell us about your business" />
            <Button type="submit" className="w-full">
              Submit for review
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
