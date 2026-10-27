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
    <header className="sticky top-0 z-40 border-b border-[#0E3B24]/8 bg-[#F7F3EA]/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2.5 sm:max-w-5xl sm:px-4">
        <Link href="/" className="shrink-0">
          <span className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[#0E3B24] sm:text-xl">
            <Image
              src="/duban-mark.png"
              alt="Duban"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full ring-2 ring-[#FFB627]/40"
              priority
            />
            <span className="leading-none">
              Duban
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#3DBE5A]">
                One-stop
              </span>
            </span>
          </span>
        </Link>

        <Link
          href="/account/addresses"
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 py-2 text-xs text-[#0E3B24] shadow-[0_1px_2px_rgba(14,59,36,0.04)]"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Link>

        <nav className="flex shrink-0 items-center">
          <Link
            href="/orders"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#0E3B24] hover:bg-[#0E3B24]/5"
            aria-label="Orders"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link
            href="/basket"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#0E3B24] hover:bg-[#0E3B24]/5"
            aria-label="Basket"
          >
            <ShoppingBasket className="h-5 w-5" />
            {basketCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFB627] px-1 text-[10px] font-bold text-[#0E3B24]">
                {basketCount}
              </span>
            )}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#0E3B24] hover:bg-[#0E3B24]/5"
            aria-label="Profile"
          >
            <UserRound className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
