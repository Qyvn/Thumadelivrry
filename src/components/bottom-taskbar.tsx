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
    href: "/homes",
    label: "Homes",
    icon: House,
    match: (p: string) => p.startsWith("/homes"),
  },
] as const;

export function BottomTaskbar() {
  const pathname = usePathname() || "/";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#0E3B24]/10 bg-[#F7F3EA]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold",
                  active ? "text-[#0E3B24]" : "text-[#0E3B24]/45",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-2xl",
                    active && "bg-[#FFB627]",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
