"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isTerminalOrderStatus } from "@/lib/order-lifecycle";

/**
 * Polls the server for in-flight orders so merchant/courier status changes
 * appear without a manual reload. Stops on terminal statuses.
 */
export function OrderLiveRefresh({
  status,
  intervalMs = 4000,
}: {
  status: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const terminal = isTerminalOrderStatus(status);

  useEffect(() => {
    if (terminal) return;
    const id = window.setInterval(() => {
      router.refresh();
      setUpdatedAt(new Date());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [terminal, intervalMs, router]);

  if (terminal) {
    return (
      <p className="mt-2 text-xs text-[#0E3B24]/45">Order complete — tracking stopped.</p>
    );
  }

  const time = updatedAt.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <p className="mt-2 text-xs font-medium text-[#0E3B24]/50">
      Live tracking · checked {time}
    </p>
  );
}
