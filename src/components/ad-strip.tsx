"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DUBAN_ADS } from "@/lib/explore-durban";

export function AdStrip() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % DUBAN_ADS.length), 7000);
    return () => clearInterval(t);
  }, []);
  const ad = DUBAN_ADS[i]!;
  const external = ad.href.startsWith("http");
  const className =
    "flex h-8 w-full items-center justify-center px-4 text-center text-[11px] font-normal tracking-[0.01em] text-[var(--muted)] transition-opacity duration-700";

  if (external) {
    return (
      <a href={ad.href} className={className} target="_blank" rel="noreferrer">
        <span className="truncate">{ad.text}</span>
      </a>
    );
  }
  return (
    <Link href={ad.href} className={className}>
      <span className="truncate">{ad.text}</span>
    </Link>
  );
}
