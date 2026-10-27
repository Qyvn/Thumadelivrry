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
    "flex h-9 w-full items-center justify-center gap-2 bg-[#0E3B24] px-3 text-center text-[11px] font-semibold tracking-wide text-[#FFB627]";

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
