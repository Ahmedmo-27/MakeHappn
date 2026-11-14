import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { Rail } from "@/components/rail";
import { canSeeAllSales } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { countLeadsAssignedTo } from "@/services/commercial";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageFallback label="Opening makehappn" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const showSales = canSeeAllSales(user) || (await countLeadsAssignedTo(user.id)) > 0;
  return (
    <div className="shell">
      <Rail user={user} showSales={showSales} />
      <div className="content">{children}</div>
    </div>
  );
}
