import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { getCustomerShell } from "@/lib/customer-context";
import { EXPLORE_PICKS, WHATS_ON } from "@/lib/explore-durban";
import { prisma } from "@/lib/db";
import { WHATSAPP_URL } from "@/lib/onestop";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, basketCount, locationLabel } = await getCustomerShell();

  const [gemCount, homeCount, merchantCount] = await Promise.all([
    prisma.hiddenGem.count({ where: { status: "APPROVED" } }),
    prisma.homeListing.count({ where: { status: "APPROVED" } }),
    prisma.merchant.count({ where: { status: "APPROVED" } }),
  ]);

  const explore = EXPLORE_PICKS.slice(0, 4);
  const upcoming = WHATS_ON.filter((w) => w.status === "upcoming").slice(0, 3);

  return (
    <AppShell user={user} basketCount={basketCount} locationLabel={locationLabel}>
      <main className="mx-auto w-full max-w-md px-5 pb-12 pt-10 sm:max-w-xl">
        <section className="flex flex-col items-center text-center">
          <Image
            src="/duban-logo.jpg"
            alt="Duban"
            width={88}
            height={88}
            className="h-[88px] w-[88px] rounded-[22px] object-cover"
            priority
          />
          <h1 className="display mt-8 text-[clamp(2.5rem,10vw,3.75rem)] text-[var(--ink)]">
            Durban.
            <br />
            All in one.
          </h1>
          <p className="mt-4 text-[15px] text-[var(--muted)]">
            Gems. Food. Stays.
          </p>
          <Link
            href="/gems"
            className="mt-8 inline-flex h-12 min-w-[10rem] items-center justify-center rounded-full bg-[var(--ink)] px-8 text-sm font-semibold text-[var(--paper)]"
          >
            Explore
          </Link>
        </section>

        <section className="mt-14 grid gap-3" aria-label="Sections">
          <Door
            href="/gems"
            title="Gems"
            meta={gemCount === 0 ? "Submit a spot" : `${gemCount} live`}
          />
          <Door
            href="/food"
            title="Food"
            meta={
              merchantCount === 0
                ? "Delivery by THUMA"
                : `${merchantCount} shops · THUMA`
            }
          />
          <Door
            href="/stays"
            title="Stays"
            meta={homeCount === 0 ? "List yours" : `${homeCount} live`}
          />
        </section>

        <section className="mt-16">
          <h2 className="display text-2xl tracking-[-0.03em]">Explore Durban</h2>
          <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {explore.map((p) => (
              <li key={p.id}>
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-baseline justify-between gap-4 py-4"
                >
                  <span>
                    <span className="block font-semibold tracking-[-0.01em]">
                      {p.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-[var(--muted)]">
                      {p.area}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">
                    {p.sourceLabel}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/gems"
            className="mt-4 inline-block text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
          >
            More gems
          </Link>
        </section>

        <section className="mt-14">
          <h2 className="display text-2xl tracking-[-0.03em]">What&apos;s on</h2>
          <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {upcoming.map((e) => (
              <li key={e.id}>
                <a
                  href={e.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block py-4"
                >
                  <span className="text-[11px] font-medium text-[var(--muted)]">
                    {e.whenLabel}
                  </span>
                  <span className="mt-1 block font-semibold tracking-[-0.01em]">
                    {e.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                    {e.sourceLabel}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-14 text-center text-sm text-[var(--muted)]">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:text-[var(--ink)] hover:underline"
          >
            WhatsApp Duban
          </a>
        </p>
      </main>
    </AppShell>
  );
}

function Door({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[20px] border border-[var(--line)] bg-[var(--card)] px-5 py-6 transition-colors hover:border-[var(--ink)]"
    >
      <span>
        <span className="display block text-[1.65rem] tracking-[-0.03em]">
          {title}
        </span>
        <span className="mt-1 block text-sm text-[var(--muted)]">{meta}</span>
      </span>
      <span className="text-[var(--muted)]" aria-hidden>
        →
      </span>
    </Link>
  );
}
