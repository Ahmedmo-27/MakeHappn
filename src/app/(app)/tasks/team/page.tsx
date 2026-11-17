import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { TaskWorkbench } from "@/components/tasks/task-workbench";

export default function TasksTeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading team tasks" />}>
      <TaskWorkbench view="team" searchParams={searchParams} />
    </Suspense>
  );
}