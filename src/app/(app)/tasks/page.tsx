import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { TaskWorkbench } from "@/components/tasks/task-workbench";

export default function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading tasks" />}>
      <TasksIndex searchParams={searchParams} />
    </Suspense>
  );
}

async function TasksIndex({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const legacyView = typeof params.view === "string" ? params.view : null;
  if (legacyView === "team" || legacyView === "week" || legacyView === "overdue") {
    redirect(`/tasks/${legacyView}`);
  }

  return <TaskWorkbench view="mine" searchParams={searchParams} />;
}