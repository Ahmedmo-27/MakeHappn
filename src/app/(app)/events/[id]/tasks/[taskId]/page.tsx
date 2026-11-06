import Link from "next/link";
import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { AssignForm, CommentForm, StatusForm } from "@/components/task-forms";
import { formatDate, formatDateTime } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getTaskDetail } from "@/services/tasks";

export default function TaskPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  return (
    <Suspense fallback={<PageFallback label="Loading the task" />}>
      <TaskScreen params={params} />
    </Suspense>
  );
}

async function TaskScreen({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const user = await getCurrentUser();
  const task = await getTaskDetail(id, taskId, user);

  return (
    <div className="grid-2">
      <section className="stack">
        <article className="panel stack">
          <div className="row">
            <span className={`status status-${task.status}`}>{task.statusLabel}</span>
            <span className="muted">{task.teamName}</span>
          </div>
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <p className="muted">
            {task.assigneeName}
            {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}
          </p>
          {task.description ? <p className="prose">{task.description}</p> : <p className="muted">No description yet.</p>}
          {!task.canChangeStatus ? (
            <p className="hint">The assignee, this team&apos;s leader, and the owner can change this task.</p>
          ) : null}
          <Link href={`/events/${task.eventId}/board`}>Back to the board</Link>
        </article>

        {task.canChangeStatus && task.status !== "backlog" ? (
          <article className="panel stack">
            <h2 style={{ margin: 0 }}>Update status</h2>
            <StatusForm taskId={task.id} status={task.status} />
          </article>
        ) : null}

        {task.canAssign ? (
          <article className="panel stack">
            <h2 style={{ margin: 0 }}>{task.status === "backlog" ? "Assign" : "Reassign"}</h2>
            <AssignForm taskId={task.id} status={task.status} roster={task.roster} assigneeId={task.assigneeId} />
          </article>
        ) : null}

        <article className="panel stack">
          <h2 style={{ margin: 0 }}>Comments</h2>
          <p className="hint">A comment is a note for the people on this task.</p>
          {task.comments.length === 0 ? <p className="muted">No comments yet.</p> : task.comments.map((comment) => (
            <div key={comment.id} className="comment">
              <strong>{comment.authorName}</strong>
              <span className="muted"> · {formatDateTime(comment.createdAt)}</span>
              <p>{comment.body}</p>
            </div>
          ))}
          <CommentForm taskId={task.id} commentCount={task.comments.length} />
        </article>
      </section>

      <aside className="panel">
        <h2>Activity</h2>
        <p className="hint">Activity is the record of assignments, status reasons, and comments.</p>
        {task.activity.length === 0 ? <p className="muted">No activity yet.</p> : (
          <ol className="activity-list">
            {task.activity.map((entry) => (
              <li key={entry.id}>
                <span>{entry.text}</span>
                <span className="muted">{formatDateTime(entry.createdAt)}</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
