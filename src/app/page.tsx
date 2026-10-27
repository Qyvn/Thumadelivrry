import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gem, House, ShoppingBasket } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { EXPLORE_PICKS, WHATS_ON } from "@/lib/explore-durban";
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

  const upcoming = WHATS_ON.filter((w) => w.status === "upcoming");

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-lg px-3 pb-8 pt-4 sm:max-w-5xl sm:px-4">
        <section className="flex items-center gap-3">
          <Image
            src="/duban-logo.jpg"
            alt="Duban"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl object-cover shadow-sm ring-1 ring-[#0E3B24]/10"
            priority
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#0E3B24]/55">{greeting}</p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0E3B24]">
              Your Durban one-stop
            </h1>
            <p className="mt-1 text-xs text-[#0E3B24]/60">
              Gems · Food &amp; Shops · Homes
            </p>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <QuickTile
              href="/gems"
              icon={<Gem className="h-5 w-5" />}
              title="Hidden Gems"
              meta={gemCount === 0 ? "Submit a gem" : `${gemCount} live`}
            />
            <QuickTile
              href="/food"
              icon={<ShoppingBasket className="h-5 w-5" />}
              title="Food & Shops"
              meta={merchantCount === 0 ? "THUMA delivery" : `${merchantCount} shops`}
              badge="THUMA"
            />
            <QuickTile
              href="/homes"
              icon={<House className="h-5 w-5" />}
              title="Homes"
              meta={homeCount === 0 ? "List your home" : `${homeCount} listings`}
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-2 px-0.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3DBE5A]">
                Duban guide picks
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Explore Durban
              </h2>
            </div>
            <Link href="/gems" className="text-xs font-semibold underline">
              All gems
            </Link>
          </div>
          <p className="mt-1 text-xs text-[#0E3B24]/55">
            Real spots with a source link — no invented reviews, prices or ratings. Gradient tiles
            only (no hotlinked photos).
          </p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EXPLORE_PICKS.map((p) => (
              <a
                key={p.id}
                href={p.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="w-[72%] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_rgba(14,59,36,0.06)] sm:w-[240px]"
              >
                <div
                  className="flex h-28 items-end p-4 text-white"
                  style={{ background: p.tile }}
                >
                  <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur">
                    {p.category}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="font-semibold leading-snug">{p.name}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-[#0E3B24]/45">{p.area}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-[#0E3B24]/65">{p.why}</p>
                  <p className="mt-2 text-[10px] font-semibold text-[#1E88C8]">
                    Source: {p.sourceLabel} ↗
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F26B1D]">
                Verified listings
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                What&apos;s on in Durban
              </h2>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#0E3B24]/55">
            From IOL, Daily News, Durban Tourism, Suncoast and public X posts — dates linked to
            sources. Not ticket sales.
          </p>
          <ul className="mt-3 space-y-3">
            {upcoming.map((e) => (
              <li key={e.id}>
                <a
                  href={e.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-[#0E3B24]/8 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug">{e.title}</p>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 opacity-40" />
                  </div>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#F26B1D]">
                    {e.whenLabel}
                  </p>
                  <p className="mt-1 text-xs text-[#0E3B24]/55">{e.area}</p>
                  <p className="mt-2 text-xs text-[#0E3B24]/70">{e.blurb}</p>
                  <p className="mt-2 text-[10px] font-semibold text-[#1E88C8]">
                    {e.sourceLabel} ↗
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-3xl bg-[#0E3B24] p-5 text-[#FFB627]">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Talk to Duban
          </h2>
          <p className="mt-2 text-sm text-[#FFB627]/75">
            Gems &amp; homes enquiries · advertise · partner — WhatsApp {WHATSAPP_DISPLAY}
          </p>
          <a
            href={WHATSAPP_URL}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-[#25D366] px-5 text-sm font-bold text-white"
            target="_blank"
            rel="noreferrer"
          >
            Open WhatsApp
          </a>
        </section>
      </main>
    </AppShell>
  );
}

function QuickTile({
  href,
  icon,
  title,
  meta,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-[38%] min-w-[132px] shrink-0 flex-col rounded-3xl border border-[#0E3B24]/8 bg-white p-3.5 shadow-[0_1px_4px_rgba(14,59,36,0.04)]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFB627] text-[#0E3B24]">
        {icon}
      </span>
      {badge && (
        <span className="mt-2 text-[9px] font-bold uppercase tracking-wide text-[#0E3B24]/40">
          {badge}
        </span>
      )}
      <span className="mt-1 text-sm font-bold leading-tight">{title}</span>
      <span className="mt-1 text-[11px] text-[#0E3B24]/50">{meta}</span>
    </Link>
  );
}
