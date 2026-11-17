import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { Rail } from "@/components/rail";
import { orEmpty } from "@/lib/db";
import { canSeeAllSales } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { countLeadsAssignedTo } from "@/services/commercial";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageFallback label="Opening makehappn" variant="panel" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const assigned = canSeeAllSales(user) ? 0 : await orEmpty(() => countLeadsAssignedTo(user.id), 0);
  const showSales = canSeeAllSales(user) || assigned > 0;
  return (
    <div className="shell">
      <Rail user={user} showSales={showSales} />
      <div className="content">{children}</div>
    </div>
  );
}
