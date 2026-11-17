import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { canViewPerformance } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getStudioAnalytics } from "@/services/analytics";

export async function loadStudioReports() {
  await connection();
  const user = await getCurrentUser();
  if (!canViewPerformance(user)) redirect("/dashboard");
  const analytics = await orEmpty(() => getStudioAnalytics(), null);
  return { analytics, offlineMessage: analytics ? undefined : DATA_OFFLINE };
}