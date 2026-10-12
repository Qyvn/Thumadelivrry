import Link from "next/link";
import { MapPin, Search, ShoppingBasket, UserRound } from "lucide-react";
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
  return (
    <header className="sticky top-0 z-40 border-b border-[#18221B]/8 bg-[#F5F0E6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="shrink-0">
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#18221B]">
            THUMA
          </span>
        </Link>

        <Link
          href="/account/addresses"
          className="hidden min-w-0 flex-1 items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm text-[#18221B] sm:flex"
        >
          <MapPin className="h-4 w-4 shrink-0 text-[#18221B]" />
          <span className="truncate">{locationLabel}</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#18221B] hover:bg-[#18221B]/5"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/basket"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#18221B] hover:bg-[#18221B]/5"
            aria-label="Basket"
          >
            <ShoppingBasket className="h-5 w-5" />
            {basketCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D0F27B] px-1 text-[10px] font-bold text-[#18221B]">
                {basketCount}
              </span>
            )}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#18221B] hover:bg-[#18221B]/5"
            aria-label="Account"
          >
            <UserRound className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
