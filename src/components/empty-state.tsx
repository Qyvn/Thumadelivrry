import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionHref,
  actionLabel,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--card)] px-5 py-14 text-center shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--sun) 18%, transparent), transparent 55%), radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--ocean) 16%, transparent), transparent 50%)",
        }}
      />
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ink)] text-[var(--paper)] shadow-lg">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </div>
      <p className="relative mt-5 font-semibold tracking-[-0.02em]">{title}</p>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="relative mt-5 inline-flex h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
