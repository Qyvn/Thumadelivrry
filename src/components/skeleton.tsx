import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--line)_80%,var(--muted)_20%)]",
        className,
      )}
      aria-hidden
    />
  );
}
