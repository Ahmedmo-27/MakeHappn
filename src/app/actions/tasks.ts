"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { parseDateInput } from "@/lib/format";
import { assertName, field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser, requireOwner } from "@/lib/session";
import { addComment, assignTask, createTask, updateTaskStatus } from "@/services/tasks";

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
    await assignTask({
      actor,
      taskId: field(formData, "taskId"),
      assigneeId: field(formData, "assigneeId"),
      reason: field(formData, "reason"),
    });
    refresh();
    return { ok: true, notice: "Task assigned" };
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
