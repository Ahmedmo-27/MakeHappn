import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { Rail } from "@/components/rail";
import { getCurrentUser } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageFallback label="Opening makehappn" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="shell">
      <Rail user={user} />
      <div className="content">{children}</div>
    </div>
  );
}
