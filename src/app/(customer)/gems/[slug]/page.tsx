import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import {
  enquiryWhatsAppUrl,
  gemCategoryLabel,
  gemEnquiryMessage,
  WHATSAPP_DISPLAY,
} from "@/lib/onestop";

export const dynamic = "force-dynamic";

export default async function GemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gem = await prisma.hiddenGem.findFirst({
    where: { slug, status: "APPROVED" },
  });
  if (!gem) notFound();
  const { user, basketCount, locationLabel } = await getCustomerShell();

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-5">
        <Link href="/gems" className="text-sm underline">
          ← Hidden Gems
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#0E3B24]/45">
          {gemCategoryLabel(gem.category)} · {gem.area}, {gem.city}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">
          {gem.name}
        </h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#0E3B24]/80">
          {gem.description}
        </p>
        {gem.tipNote && (
          <p className="mt-4 rounded-xl bg-[#FFB627]/20 px-4 py-3 text-sm">
            <span className="font-semibold">Local tip:</span> {gem.tipNote}
          </p>
        )}
        {gem.addressHint && (
          <p className="mt-3 text-sm text-[#0E3B24]/65">Near: {gem.addressHint}</p>
        )}
        <div className="mt-8 rounded-2xl border border-[#0E3B24]/10 bg-white p-5">
          <p className="text-sm font-semibold">Enquiries only</p>
          <p className="mt-1 text-sm text-[#0E3B24]/65">
            Duban does not take bookings or payments for gems. Chat with us on WhatsApp{" "}
            {WHATSAPP_DISPLAY}.
          </p>
          <a
            href={enquiryWhatsAppUrl(gemEnquiryMessage(gem))}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-[#25D366] px-5 text-sm font-bold text-white"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp enquiry
          </a>
        </div>
      </main>
    </AppShell>
  );
}
