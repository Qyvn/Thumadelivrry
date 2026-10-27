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

  const upcoming = WHATS_ON.filter((w) => w.status === "upcoming");

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-lg px-4 pb-10 pt-6 sm:max-w-3xl">
        {/* One big idea */}
        <section className="reveal">
          <p className="eyebrow">
            {user ? `Hi ${user.fullName.split(" ")[0]}` : "Duban"}
          </p>
          <h1 className="display mt-3 max-w-[11ch] text-[clamp(2.75rem,11vw,4.5rem)] text-[var(--ink)]">
            Durban.
            <br />
            <span className="text-[var(--green)]">All in one.</span>
          </h1>
          <p className="mt-5 max-w-[28ch] text-[0.95rem] leading-relaxed text-[var(--muted)]">
            Gems. Food. Homes. Sourced honestly — enquire on WhatsApp.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/gems"
              className="inline-flex h-12 items-center rounded-full bg-[var(--ink)] px-6 text-sm font-semibold text-[var(--paper)]"
            >
              Explore
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center rounded-full border border-[var(--ink)] px-6 text-sm font-semibold text-[var(--ink)]"
            >
              WhatsApp
            </a>
          </div>
        </section>

        <section className="reveal mt-12" style={{ animationDelay: "80ms" }}>
          <div className="scroll-hide flex gap-3 overflow-x-auto pb-1">
            <QuickTile
              href="/gems"
              icon={<Gem className="h-4 w-4" />}
              title="Gems"
              meta={gemCount === 0 ? "Submit a gem" : `${gemCount} live`}
            />
            <QuickTile
              href="/food"
              icon={<ShoppingBasket className="h-4 w-4" />}
              title="Food"
              meta={
                merchantCount === 0
                  ? "THUMA delivery"
                  : `${merchantCount} shops`
              }
              badge="THUMA"
            />
            <QuickTile
              href="/homes"
              icon={<House className="h-4 w-4" />}
              title="Homes"
              meta={homeCount === 0 ? "List yours" : `${homeCount} listings`}
            />
          </div>
        </section>

        <section className="reveal mt-14" style={{ animationDelay: "120ms" }}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Guide picks</p>
              <h2 className="display mt-2 text-[clamp(1.75rem,6vw,2.5rem)]">
                Explore Durban
              </h2>
            </div>
            <Link
              href="/gems"
              className="mb-1 text-xs font-semibold tracking-wide text-[var(--ocean)] underline-offset-4 hover:underline"
            >
              All gems
            </Link>
          </div>
          <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
            Real spots. Source linked. No invented reviews or ratings.
          </p>
          <div className="scroll-hide mt-6 flex gap-4 overflow-x-auto pb-2">
            {EXPLORE_PICKS.map((p) => (
              <a
                key={p.id}
                href={p.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="w-[78%] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--card)] sm:w-[260px]"
              >
                <div
                  className="flex h-32 items-end p-4"
                  style={{ background: p.tile }}
                >
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">
                    {p.category}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <p className="display text-xl leading-none tracking-[-0.03em]">
                    {p.name}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                    {p.area}
                  </p>
                  <p className="line-clamp-2 text-sm leading-snug text-[var(--muted)]">
                    {p.why}
                  </p>
                  <p className="pt-1 text-[11px] font-semibold text-[var(--ocean)]">
                    {p.sourceLabel} →
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="reveal mt-14" style={{ animationDelay: "160ms" }}>
          <p className="eyebrow">Calendar</p>
          <h2 className="display mt-2 text-[clamp(1.75rem,6vw,2.5rem)]">
            What&apos;s on
          </h2>
          <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
            Dated. Sourced. Not a ticket shop.
          </p>
          <ul className="mt-6 space-y-3">
            {upcoming.map((e) => (
              <li key={e.id}>
                <a
                  href={e.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--ink)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sunset)]">
                      {e.whenLabel}
                    </p>
                    <p className="mt-1.5 font-[family-name:var(--font-display)] text-lg font-bold leading-tight tracking-[-0.02em]">
                      {e.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{e.area}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{e.blurb}</p>
                    <p className="mt-2 text-[11px] font-semibold text-[var(--ocean)]">
                      {e.sourceLabel} →
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--ink)]" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="reveal mt-14 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--ink)] px-6 py-8 text-[var(--paper)]">
          <div className="flex items-start gap-4">
            <Image
              src="/duban-mark.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h2 className="display text-3xl tracking-[-0.04em]">Talk.</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
                Enquiries, partners, ads — WhatsApp {WHATSAPP_DISPLAY}
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--sun)] px-5 text-sm font-bold text-[var(--ink)]"
              >
                Open WhatsApp
              </a>
            </div>
          </div>
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
      className="flex w-[36%] min-w-[128px] shrink-0 flex-col rounded-[var(--radius)] border border-[var(--line)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--ink)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--ink)] text-[var(--paper)]">
        {icon}
      </span>
      {badge && (
        <span className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          {badge}
        </span>
      )}
      <span className="mt-2 font-[family-name:var(--font-display)] text-base font-bold tracking-[-0.02em]">
        {title}
      </span>
      <span className="mt-1 text-[11px] text-[var(--muted)]">{meta}</span>
    </Link>
  );
}
