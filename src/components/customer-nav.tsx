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
    <header className="sticky top-0 z-40 border-b border-[#18221B]/8 bg-[#F5F0E6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link href="/" className="shrink-0">
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#18221B] sm:text-2xl">
            THUMA
          </span>
        </Link>

        <Link
          href="/account/addresses"
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 py-2 text-xs text-[#18221B] shadow-[0_1px_2px_rgba(24,34,27,0.04)] sm:gap-2 sm:px-3 sm:text-sm"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 sm:h-4 sm:w-4" />
        </Link>

        <nav className="flex shrink-0 items-center">
          <Link
            href="/orders"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#18221B] hover:bg-[#18221B]/5 sm:h-11 sm:w-11"
            aria-label="Orders and notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link
            href="/basket"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#18221B] hover:bg-[#18221B]/5 sm:h-11 sm:w-11"
            aria-label="Basket"
          >
            <ShoppingBasket className="h-5 w-5" />
            {basketCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D0F27B] px-1 text-[10px] font-bold text-[#18221B]">
                {basketCount}
              </span>
            )}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#18221B] hover:bg-[#18221B]/5 sm:h-11 sm:w-11"
            aria-label="Profile"
          >
            <UserRound className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
