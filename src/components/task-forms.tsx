"use client";

import { useActionState } from "react";
import { assignTaskAction, changeTaskStatusForm, commentAction } from "@/app/actions/tasks";
import { BOARD_STATUSES, STATUS_LABEL, type TaskStatus } from "@/lib/domain";
import type { ActionResult } from "@/lib/result";
import { SubmitButton } from "@/components/submit-button";

export function AssignForm({
  taskId,
  status,
  roster,
  assigneeId,
}: {
  taskId: string;
  status: TaskStatus;
  roster: { id: string; name: string }[];
  assigneeId: string | null;
}) {
  const [state, action] = useActionState(assignTaskAction, null as ActionResult | null);
  const leavingBacklog = status === "backlog";
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="taskId" value={taskId} />
      <label className="field">
        <span>Assign to</span>
        <select className="select" name="assigneeId" defaultValue={assigneeId ?? ""} required>
          <option value="" disabled>Choose a person</option>
          {roster.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
        <p className="hint">
          {leavingBacklog
            ? "Choosing a person moves this task from Backlog to To Do. That is a status change, so a reason is required."
            : "Reassigning does not change the status, so no reason is required. The change is still recorded."}
        </p>
      </label>
      {leavingBacklog ? (
        <label className="field">
          <span>Reason for moving to To Do</span>
          <textarea className="textarea" name="reason" required placeholder="Why this task is ready" />
        </label>
      ) : null}
      {state && !state.ok ? <p className="banner banner-error">{state.error}</p> : null}
      {state?.ok && state.notice ? <p className="banner banner-ok">{state.notice}</p> : null}
      <SubmitButton>{leavingBacklog ? "Assign and move to To Do" : "Reassign"}</SubmitButton>
    </form>
  );
}

export function StatusForm({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [state, action] = useActionState(changeTaskStatusForm, null as ActionResult | null);
  return (
    <form action={action} className="form-grid" key={status}>
      <input type="hidden" name="taskId" value={taskId} />
      <label className="field">
        <span>Status</span>
        <select className="select" name="status" defaultValue={status === "backlog" ? "todo" : status}>
          {BOARD_STATUSES.map((item) => (
            <option key={item} value={item}>{STATUS_LABEL[item]}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Reason</span>
        <textarea className="textarea" name="reason" required placeholder="Why the status is changing" />
        <p className="hint">A blank reason is refused. The reason is kept in the task history.</p>
      </label>
      {state && !state.ok ? <p className="banner banner-error">{state.error}</p> : null}
      {state?.ok ? <p className="banner banner-ok">Status updated</p> : null}
      <SubmitButton>Update status</SubmitButton>
    </form>
  );
}

export function CommentForm({ taskId, commentCount }: { taskId: string; commentCount: number }) {
  const [state, action] = useActionState(commentAction, null as ActionResult | null);
  return (
    <form action={action} className="form-grid" key={commentCount}>
      <input type="hidden" name="taskId" value={taskId} />
      <label className="field">
        <span>Comment</span>
        <textarea className="textarea" name="body" required placeholder="Add a note for the team" />
        <p className="hint">A comment is a note. It does not change the status.</p>
      </label>
      {state && !state.ok ? <p className="banner banner-error">{state.error}</p> : null}
      <SubmitButton>Add comment</SubmitButton>
    </form>
  );
}
