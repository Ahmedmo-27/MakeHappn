"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { parseDateInput } from "@/lib/format";
import { assertName, field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import { isTaskStatus, type TaskStatus } from "@/lib/domain";
import { createProjectTask, moveProjectTaskStatus } from "@/services/tasks";

export async function createProjectTaskAction(formData: FormData) {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/board`;
  try {
    await getCurrentUser();
    const due = field(formData, "dueDate");
    const dueDate = due ? parseDateInput(due) : null;
    if (!dueDate) throw new Error("A due date is required");
    const ownerId = field(formData, "accountableOwnerId");
    const collaboratorIds = fieldList(formData, "collaboratorIds").filter((id) => id !== ownerId);
    const priority = (field(formData, "priority") || "medium") as "urgent" | "high" | "medium" | "low";
    const taskCategory = (field(formData, "taskCategory") || "deliverable_prerequisite") as
      | "deliverable_prerequisite"
      | "continuous_support"
      | "operational_internal";
    const isGatePrerequisite = formData.get("isGatePrerequisite") === "true";

    await createProjectTask({
      projectId,
      stage: field(formData, "stage") || null,
      accountableOwnerId: ownerId,
      collaboratorIds,
      title: assertName(field(formData, "title"), "Title", 160),
      description: field(formData, "description"),
      dueDate,
      priority,
      taskCategory,
      isGatePrerequisite,
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Task added to project board" });
}

export async function moveProjectTaskStatusAction(formData: FormData) {
  const projectId = field(formData, "projectId");
  const taskId = field(formData, "taskId");
  const status = field(formData, "status");
  const reason = field(formData, "reason");
  const path = `/projects/${projectId}/board`;

  try {
    const actor = await getCurrentUser();
    if (!isTaskStatus(status)) throw new Error("Invalid task status");
    await moveProjectTaskStatus(taskId, status as TaskStatus, actor.id, reason);
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Task status updated" });
}
