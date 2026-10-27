import { SessionUser } from "@/lib/auth";
import { AdStrip } from "@/components/ad-strip";
import { BottomTaskbar } from "@/components/bottom-taskbar";
import { CustomerNav } from "@/components/customer-nav";
import { DevBanner } from "@/components/dev-banner";

export function AppShell({
  user,
  basketCount,
  locationLabel,
  children,
  hideTaskbar,
}: {
  user: SessionUser | null;
  basketCount: number;
  locationLabel: string;
  children: React.ReactNode;
  hideTaskbar?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--paper)] text-[var(--ink)]">
      <DevBanner />
      <AdStrip />
      <CustomerNav user={user} basketCount={basketCount} locationLabel={locationLabel} />
      <div className={hideTaskbar ? "flex-1" : "flex-1 pb-20"}>{children}</div>
      {!hideTaskbar && <BottomTaskbar />}
    </div>
  );
}
