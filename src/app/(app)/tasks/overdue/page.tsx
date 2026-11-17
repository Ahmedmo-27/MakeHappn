import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { TaskWorkbench } from "@/components/tasks/task-workbench";

export default function TasksOverduePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading overdue tasks" />}>
      <TaskWorkbench view="overdue" searchParams={searchParams} />
    </Suspense>
  );
}