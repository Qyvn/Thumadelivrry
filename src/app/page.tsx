import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gem, Home, ShoppingBasket } from "lucide-react";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";
import { getCustomerShell } from "@/lib/customer-context";
import { prisma } from "@/lib/db";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/onestop";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, basketCount, locationLabel } = await getCustomerShell();

  const [gemCount, homeCount, merchantCount] = await Promise.all([
    prisma.hiddenGem.count({ where: { status: "APPROVED" } }),
    prisma.homeListing.count({ where: { status: "APPROVED" } }),
    prisma.merchant.count({ where: { status: "APPROVED" } }),
  ]);

  const greeting = user
    ? `Hi ${user.fullName.split(" ")[0]}`
    : "Welcome to Duban";

  return (
    <div className="flex min-h-full flex-col bg-[#F7F3EA]">
      <DevBanner />
      <CustomerNav
        user={user}
        basketCount={basketCount}
        locationLabel={locationLabel}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5">
        <section className="animate-rise flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Image
            src="/duban-logo.jpg"
            alt="Duban"
            width={96}
            height={96}
            className="h-20 w-20 rounded-2xl object-cover shadow-sm sm:h-24 sm:w-24"
            priority
          />
          <div>
            <p className="text-sm font-medium text-[#0E3B24]/55">{greeting}</p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0E3B24] sm:text-4xl">
              Your Durban one-stop
            </h1>
            <p className="mt-2 max-w-md text-sm text-[#0E3B24]/65">
              Hidden gems, food &amp; shops delivered with THUMA, and homes to rent around Durban.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <SectionCard
            href="/gems"
            icon={<Gem className="h-5 w-5" />}
            title="Hidden Gems"
            body="Local Durban spots — submitted by people, approved by Duban. No invented places."
            meta={
              gemCount === 0
                ? "Coming soon — submit a gem"
                : `${gemCount} approved spot${gemCount === 1 ? "" : "s"}`
            }
          />
          <SectionCard
            href="/food"
            icon={<ShoppingBasket className="h-5 w-5" />}
            title="Food & Shops"
            body="Groceries, meals and essentials. Delivery powered by THUMA."
            meta={
              merchantCount === 0
                ? "Merchants onboarding"
                : `${merchantCount} approved merchant${merchantCount === 1 ? "" : "s"}`
            }
            badge="Delivery powered by THUMA"
          />
          <SectionCard
            href="/homes"
            icon={<Home className="h-5 w-5" />}
            title="Homes to Rent"
            body="Short stays and long-term rentals. Enquiry-only via WhatsApp — no payments on Duban."
            meta={
              homeCount === 0
                ? "Listings coming soon — list your home"
                : `${homeCount} approved listing${homeCount === 1 ? "" : "s"}`
            }
          />
        </section>

        <section className="mt-10 rounded-2xl border border-[#0E3B24]/8 bg-white p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Talk to Duban
          </h2>
          <p className="mt-2 text-sm text-[#0E3B24]/65">
            Gems and homes enquiries go to WhatsApp {WHATSAPP_DISPLAY}. Food orders use the THUMA
            checkout in Food &amp; Shops.
          </p>
          <a
            href={WHATSAPP_URL}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-[#25D366] px-5 text-sm font-bold text-white"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </section>
      </main>

      <footer className="border-t border-[#0E3B24]/8 bg-[#0E3B24] px-4 py-8 text-[#FFB627]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/duban-mark.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full"
            />
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">Duban</p>
              <p className="text-sm text-[#FFB627]/70">
                Love Durban · Delivery powered by THUMA · {WHATSAPP_DISPLAY}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/gems" className="hover:underline">Gems</Link>
            <Link href="/food" className="hover:underline">Food</Link>
            <Link href="/homes" className="hover:underline">Homes</Link>
            <Link href="/merchant" className="hover:underline">Merchant</Link>
            <Link href="/admin" className="hover:underline">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionCard({
  href,
  icon,
  title,
  body,
  meta,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  meta: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-[#0E3B24]/8 bg-white p-5 transition hover:border-[#0E3B24]/25"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB627] text-[#0E3B24]">
        {icon}
      </span>
      {badge && (
        <span className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#0E3B24]/45">
          {badge}
        </span>
      )}
      <span className="mt-2 flex items-center justify-between gap-2">
        <span className="font-[family-name:var(--font-display)] text-lg font-bold">{title}</span>
        <ArrowRight className="h-4 w-4 opacity-40 transition group-hover:opacity-100" />
      </span>
      <span className="mt-2 flex-1 text-sm text-[#0E3B24]/65">{body}</span>
      <span className="mt-4 text-xs font-semibold text-[#0E3B24]/50">{meta}</span>
    </Link>
  );
}
