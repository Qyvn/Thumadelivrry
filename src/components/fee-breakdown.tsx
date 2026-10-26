import { formatZar } from "@/lib/utils";

export type FeeBreakdownProps = {
  itemTotalCents: number;
  deliveryFeeCents: number;
  baseDeliveryFeeCents?: number;
  serviceFeeCents: number;
  smallOrderFeeCents: number;
  peakFeeCents: number;
  tipCents?: number;
  totalCents: number;
  distanceKm?: number | null;
  distanceSource?: string | null;
  plusApplied?: boolean;
  notes?: string[];
  totalLabel?: string;
};

const SOURCE_LABEL: Record<string, string> = {
  HAVERSINE: "straight-line from shop",
  ZONE_CENTER: "estimated from zone centre",
  FALLBACK: "estimated (no map pin)",
};

export function FeeBreakdown(p: FeeBreakdownProps) {
  const distance =
    p.distanceKm != null
      ? `${p.distanceKm.toFixed(1)} km${p.distanceSource ? ` · ${SOURCE_LABEL[p.distanceSource] ?? p.distanceSource}` : ""}`
      : null;
  return (
    <div
      data-testid="fee-breakdown"
      className="space-y-2 rounded-2xl bg-white p-5 text-sm shadow-[0_1px_2px_rgba(14,59,36,0.04)]"
    >
      <Row label="Items subtotal" value={formatZar(p.itemTotalCents)} />
      <Row
        label="Delivery fee"
        hint={distance ?? undefined}
        value={
          p.deliveryFeeCents === 0 && (p.baseDeliveryFeeCents ?? 0) > 0
            ? `Free (was ${formatZar(p.baseDeliveryFeeCents!)})`
            : formatZar(p.deliveryFeeCents)
        }
      />
      <Row
        label="Service fee"
        value={p.serviceFeeCents === 0 ? "Waived" : formatZar(p.serviceFeeCents)}
      />
      {p.smallOrderFeeCents > 0 && (
        <Row label="Small-order fee" value={formatZar(p.smallOrderFeeCents)} />
      )}
      {p.peakFeeCents > 0 && (
        <Row label="Peak-time fee (paid to courier)" value={formatZar(p.peakFeeCents)} />
      )}
      {(p.tipCents ?? 0) > 0 && (
        <Row label="Courier tip (100% to courier)" value={formatZar(p.tipCents!)} />
      )}
      <div className="border-t border-[#0E3B24]/10 pt-3">
        <Row label={p.totalLabel ?? "Total"} value={formatZar(p.totalCents)} strong />
      </div>
      {(p.plusApplied || (p.notes && p.notes.length > 0)) && (
        <ul className="space-y-0.5 pt-1 text-xs text-[#0E3B24]/60">
          {p.notes?.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 ${strong ? "text-base font-bold" : ""}`}>
      <span>
        {label}
        {hint && <span className="block text-xs font-normal text-[#0E3B24]/50">{hint}</span>}
      </span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}
