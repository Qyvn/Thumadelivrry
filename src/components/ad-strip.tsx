"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DUBAN_ADS } from "@/lib/explore-durban";

export function AdStrip() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % DUBAN_ADS.length), 4500);
    return () => clearInterval(t);
  }, []);
  const ad = DUBAN_ADS[i]!;
  const external = ad.href.startsWith("http");
  const className =
    "flex h-9 w-full items-center justify-center gap-2 bg-[var(--ink)] px-4 text-center text-[11px] font-medium tracking-[0.02em] text-[var(--paper)] transition-opacity";

  if (external) {
    return (
      <a href={ad.href} className={className} target="_blank" rel="noreferrer">
        <span className="truncate">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--sunset)] align-middle" aria-hidden />
          {ad.text}
        </span>
      </a>
    );
  }
  return (
    <Link href={ad.href} className={className}>
      <span className="truncate">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--sunset)] align-middle" aria-hidden />
        {ad.text}
      </span>
    </Link>
  );
}
