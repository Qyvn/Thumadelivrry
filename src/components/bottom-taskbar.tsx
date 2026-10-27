"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, Home, ShoppingBasket, House } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/gems",
    label: "Gems",
    icon: Gem,
    match: (p: string) => p.startsWith("/gems"),
  },
  {
    href: "/food",
    label: "Food",
    icon: ShoppingBasket,
    match: (p: string) =>
      p.startsWith("/food") ||
      p.startsWith("/browse") ||
      p.startsWith("/shops") ||
      p.startsWith("/basket") ||
      p.startsWith("/checkout"),
  },
  {
    href: "/stays",
    label: "Stays",
    icon: House,
    match: (p: string) => p.startsWith("/stays"),
  },
] as const;

export function BottomTaskbar() {
  const pathname = usePathname() || "/";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--paper)]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      <ul className="mx-auto flex h-14 max-w-md items-stretch justify-around px-3">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-[var(--ink)]" : "text-[var(--muted)]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.6} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
