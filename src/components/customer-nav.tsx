import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, MapPin, ShoppingBasket, UserRound } from "lucide-react";
import { SessionUser } from "@/lib/auth";

export function CustomerNav({
  user,
  basketCount,
  locationLabel,
}: {
  user: SessionUser | null;
  basketCount: number;
  locationLabel: string;
}) {
  const label = locationLabel?.trim() || "Durban";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3 sm:max-w-3xl">
        <Link href="/" className="shrink-0 focus-visible:rounded-lg">
          <span className="inline-flex items-center gap-2.5">
            <Image
              src="/duban-mark.png"
              alt="Duban"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full"
              priority
            />
            <span className="display text-[1.15rem] leading-none tracking-[-0.04em] text-[var(--ink)]">
              Duban
            </span>
          </span>
        </Link>

        <Link
          href="/account/addresses"
          className="ml-auto flex min-w-0 max-w-[9.5rem] items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--ink)] sm:max-w-[12rem]"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--sunset)]" />
          <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
        </Link>

        <nav className="flex shrink-0 items-center gap-0.5">
          <Link
            href="/orders"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink)] hover:bg-[var(--line)]/60"
            aria-label="Orders"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <Link
            href="/basket"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink)] hover:bg-[var(--line)]/60"
            aria-label="Basket"
          >
            <ShoppingBasket className="h-5 w-5" strokeWidth={1.75} />
            {basketCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--sunset)] px-1 text-[9px] font-bold text-white">
                {basketCount}
              </span>
            )}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink)] hover:bg-[var(--line)]/60"
            aria-label="Profile"
          >
            <UserRound className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
