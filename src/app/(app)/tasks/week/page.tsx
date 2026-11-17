import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { TaskWorkbench } from "@/components/tasks/task-workbench";

export default function TasksWeekPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading this week" />}>
      <TaskWorkbench view="week" searchParams={searchParams} />
    </Suspense>
  );
}