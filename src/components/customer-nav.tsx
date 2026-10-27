import Image from "next/image";
import Link from "next/link";
import { ShoppingBasket, UserRound } from "lucide-react";
import { SessionUser } from "@/lib/auth";

export function CustomerNav({
  user,
  basketCount,
}: {
  user: SessionUser | null;
  basketCount: number;
  locationLabel: string;
}) {
  return (
    <header className="sticky top-0 z-40 bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3 sm:max-w-xl">
        <Link href="/" className="shrink-0" aria-label="Duban home">
          <Image
            src="/duban-mark.png"
            alt="Duban"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
            priority
          />
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/basket"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--line)]/50"
            aria-label="Basket"
          >
            <ShoppingBasket className="h-5 w-5" strokeWidth={1.6} />
            {basketCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--ink)]" />
            )}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--line)]/50"
            aria-label="Profile"
          >
            <UserRound className="h-5 w-5" strokeWidth={1.6} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
