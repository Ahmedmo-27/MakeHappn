"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { parseDateInput } from "@/lib/format";
import { assertName, field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser, requireOwner } from "@/lib/session";
import { addComment, assignTask, createTask, updateTask, updateTaskStatus, createProjectTask, moveProjectTaskStatus } from "@/services/tasks";
import { isTaskStatus, type TaskStatus } from "@/lib/domain";

export async function createTaskAction(formData: FormData) {
  const eventId = field(formData, "eventId");
  const path = `/events/${eventId}/backlog`;
  try {
    const actor = await requireOwner();
    const due = field(formData, "dueDate");
    const dueDate = due ? parseDateInput(due) : null;
    if (due && !dueDate) throw new Error("Enter a valid due date");
    const description = field(formData, "description");
    if (description.length > 8000) throw new Error("Description is too long");
    await createTask({
      actor,
      eventId,
      teamId: field(formData, "teamId"),
      title: assertName(field(formData, "title"), "Title", 160),
      description,
      dueDate,
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Task added to the backlog" });
}

export async function assignTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await getCurrentUser();
    const notice = await assignTask({
      actor,
      taskId: field(formData, "taskId"),
      assigneeId: field(formData, "assigneeId"),
      reason: field(formData, "reason"),
    });
    refresh();
    return { ok: true, notice };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function changeTaskStatusAction(input: {
  taskId: string;
  toStatus: string;
  reason: string;
}): Promise<ActionResult> {
  try {
    const actor = await getCurrentUser();
    await updateTaskStatus({ actor, ...input });
    refresh();
    return { ok: true, notice: "Status updated" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function changeTaskStatusForm(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return changeTaskStatusAction({
    taskId: field(formData, "taskId"),
    toStatus: field(formData, "status"),
    reason: field(formData, "reason"),
  });
}

export async function updateTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await getCurrentUser();
    const due = field(formData, "dueDate");
    const dueDate = due ? parseDateInput(due) : null;
    if (due && !dueDate) return { ok: false, error: "Enter a valid due date" };
    const description = field(formData, "description");
    const teamId = field(formData, "teamId");
    const result = await updateTask({
      actor,
      taskId: field(formData, "taskId"),
      title: assertName(field(formData, "title"), "Title", 160),
      description,
      dueDate,
      teamId: teamId || undefined,
    });
    refresh();
    return { ok: true, notice: result.notice };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function commentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await getCurrentUser();
    await addComment({
      actor,
      taskId: field(formData, "taskId"),
      body: field(formData, "body"),
    });
    refresh();
    return { ok: true, notice: "Comment added" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function createProjectTaskAction(formData: FormData) {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/board`;
  try {
    await getCurrentUser();
    const due = field(formData, "dueDate");
    const dueDate = due ? parseDateInput(due) : null;
    const priority = (field(formData, "priority") || "medium") as "urgent" | "high" | "medium" | "low";
    const taskCategory = (field(formData, "taskCategory") || "deliverable_prerequisite") as
      | "deliverable_prerequisite"
      | "continuous_support"
      | "operational_internal";
    const isGatePrerequisite = formData.get("isGatePrerequisite") === "true";

    await createProjectTask({
      projectId,
      stage: field(formData, "stage") || null,
      laneId: field(formData, "laneId"),
      accountableOwnerId: field(formData, "accountableOwnerId"),
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
