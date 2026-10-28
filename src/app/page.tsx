import Link from "next/link";
import Image from "next/image";
import { Gem, ShoppingBasket, House, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FadeImage } from "@/components/fade-image";
import { getCustomerShell } from "@/lib/customer-context";
import { EXPLORE_PICKS, WHATS_ON } from "@/lib/explore-durban";
import { DURBAN_PHOTOS, HERO_PHOTO, NIGHTLIFE_PHOTO } from "@/lib/durban-photos";
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
      <main className="pb-12">
        <section className="relative isolate min-h-[72vh] overflow-hidden">
          <picture>
            <source media="(min-width: 768px)" srcSet={HERO_PHOTO.wideSet} sizes="100vw" />
            <img
              src={HERO_PHOTO.tall}
              srcSet={HERO_PHOTO.tallSet}
              sizes="100vw"
              alt={HERO_PHOTO.place}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.62),rgba(0,0,0,.5)_55%,rgba(0,0,0,.55)_82%,var(--paper))]"
          />
          <div className="relative mx-auto flex min-h-[72vh] w-full max-w-md flex-col items-center justify-center px-5 pb-10 pt-16 text-center sm:max-w-xl">
            <Image
              src="/duban-logo.jpg"
              alt="Duban"
              width={88}
              height={88}
              className="h-[88px] w-[88px] rounded-[22px] object-cover shadow-[0_12px_40px_rgba(0,0,0,.35)] ring-1 ring-white/25"
              priority
            />
            <h1 className="display mt-8 text-[clamp(2.6rem,11vw,3.9rem)] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,.45)]">
              Durban.
              <br />
              All in one.
            </h1>
            <p className="mt-4 text-[15px] text-white/85">Gems. Food. Stays.</p>
            <Link
              href="/gems"
              className="mt-8 inline-flex h-12 min-w-[10rem] items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-[var(--ink)] shadow-lg"
            >
              Explore
            </Link>
            <p className="mt-10 text-[10px] text-white/80">Photo: Duban</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md px-5 sm:max-w-xl">
          <section className="-mt-6 grid gap-3" aria-label="Sections">
            <Door
              href="/gems"
              title="Gems"
              meta={gemCount === 0 ? "Submit a spot" : `${gemCount} live`}
              photo={DURBAN_PHOTOS.botanic}
              tint="from-[#0e3b24]/75 via-[#0e3b24]/35 to-transparent"
              icon={Gem}
            />
            <Door
              href="/food"
              title="Food"
              meta={
                merchantCount === 0
                  ? "Delivery by THUMA"
                  : `${merchantCount} shops · THUMA`
              }
              photo={DURBAN_PHOTOS["victoria-market"]}
              tint="from-[#f26b1d]/80 via-[#f26b1d]/35 to-transparent"
              icon={ShoppingBasket}
            />
            <Door
              href="/stays"
              title="Stays"
              meta={homeCount === 0 ? "List yours" : `${homeCount} live`}
              photo={DURBAN_PHOTOS.umhlanga}
              tint="from-[#1e88c8]/80 via-[#1e88c8]/35 to-transparent"
              icon={House}
            />
          </section>

          <section className="mt-14">
            <h2 className="display text-2xl tracking-[-0.03em]">Explore Durban</h2>
            <ul className="mt-5 space-y-3">
              {explore.map((p) => {
                const photo = DURBAN_PHOTOS[p.photoId];
                return (
                  <li key={p.id}>
                    <a
                      href={p.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative flex min-h-[5.5rem] overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-soft)]"
                    >
                      <div className="relative w-[38%] shrink-0">
                        <FadeImage
                          src={photo.src}
                          alt={photo.place}
                          fill
                          sizes="160px"
                          className="transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <span className="flex flex-1 flex-col justify-center px-4 py-3">
                        <span className="font-semibold tracking-[-0.01em]">{p.name}</span>
                        <span className="mt-0.5 text-sm text-[var(--muted)]">{p.area}</span>
                        <span className="mt-2 text-[10px] text-[var(--muted)]">
                          {p.sourceLabel} · {photo.owner ? "Photo: Duban" : `${photo.author} / ${photo.license}`}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/gems"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
            >
              More gems <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          <section className="mt-14">
            <h2 className="display text-2xl tracking-[-0.03em]">What&apos;s on</h2>
            <div className="relative mt-5 h-40 overflow-hidden rounded-[20px] shadow-[var(--shadow-card)]">
              <FadeImage src={NIGHTLIFE_PHOTO.src} alt="Umhlanga Rocks sign at night" fill sizes="(max-width: 640px) 100vw, 36rem" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">Durban after dark</p>
              <p className="absolute bottom-3 right-4 text-[10px] text-white/80">Photo: Duban</p>
            </div>
            <ul className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <a
                    href={e.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-4"
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
        </div>
      </main>
    </AppShell>
  );
}

function Door({
  href,
  title,
  meta,
  photo,
  tint,
  icon: Icon,
}: {
  href: string;
  title: string;
  meta: string;
  photo: (typeof DURBAN_PHOTOS)[keyof typeof DURBAN_PHOTOS];
  tint: string;
  icon: typeof Gem;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[7.25rem] items-end overflow-hidden rounded-[22px] border border-[var(--line)] shadow-[var(--shadow-card)]"
    >
      <FadeImage
        src={photo.src}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 36rem"
        className="transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <div aria-hidden className={`absolute inset-0 bg-gradient-to-r ${tint}`} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
      <span className="relative flex w-full items-end justify-between gap-3 px-5 pb-4 pt-16 text-white">
        <span>
          <span className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="display mt-2 block text-[1.65rem] tracking-[-0.03em]">
            {title}
          </span>
          <span className="mt-1 block text-sm text-white/85">{meta}</span>
          <span className="mt-2 block text-[10px] text-white/65">
            {photo.owner ? "Photo: Duban" : `${photo.author} · ${photo.license}`}
          </span>
        </span>
        <span className="mb-1 text-white/80" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
