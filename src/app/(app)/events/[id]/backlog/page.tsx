import Link from "next/link";
import { Suspense } from "react";
import { createTaskAction } from "@/app/actions/tasks";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { AssignForm } from "@/components/task-forms";
import { formatDate, readMessage } from "@/lib/format";
import { canAssignTask } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { listBacklog } from "@/services/tasks";

export default function BacklogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading the backlog" />}>
      <Backlog params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Backlog({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const [user, flash] = await Promise.all([getCurrentUser(), searchParams.then(readMessage)]);
  const { event, tasks, people } = await listBacklog(id, user);

  return (
    <div className="stack">
      <Banner error={flash.error} notice={flash.notice} />
      {user.role === "owner" ? (
        <form action={createTaskAction} className="panel form-grid">
          <h2 style={{ margin: 0 }}>Add to the backlog</h2>
          <p className="hint">A new task belongs to a team and has no person yet. The team leader assigns someone, which moves it to To Do.</p>
          <input type="hidden" name="eventId" value={event.id} />
          <label className="field">
            <span>Title</span>
            <input className="input" name="title" required placeholder="Lock the spatial plan" />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea className="textarea" name="description" placeholder="What the reveal should feel like" />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Team</span>
              <select className="select" name="teamId" required defaultValue="">
                <option value="" disabled>Choose a team</option>
                {event.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Due date</span>
              <input className="input" type="date" name="dueDate" />
            </label>
          </div>
          <SubmitButton>Add task</SubmitButton>
        </form>
      ) : null}

      {tasks.length === 0 ? (
        <div className="empty">
          <p>The backlog is clear.</p>
          <p className="hint">
            {user.role === "leader"
              ? "The owner has not added backlog tasks for your team yet. They will show up here for you to assign. Work that already has a person is on the Board."
              : user.role === "member"
                ? "Work assigned to you is on the Board. Open a task to change its status. A reason is required, and you cannot move someone else's card."
                : "Work that already has a person is on the Board."}
          </p>
          <Link href={`/events/${event.id}/board`}>Open the board</Link>
        </div>
      ) : null}
      {event.teams
        .filter((team) => user.role === "owner" || team.id === user.teamId)
        .map((team) => {
          const teamTasks = tasks.filter((task) => task.teamId === team.id);
          if (user.role !== "owner" && teamTasks.length === 0) return null;
          const roster = people.filter((person) => person.teamId === team.id);
          return (
            <section key={team.id} className="stack">
              <h2>{team.name}</h2>
              {teamTasks.length === 0 ? <p className="muted">No backlog tasks for this team.</p> : null}
              {teamTasks.map((task) => (
                <article key={task.id} className="panel stack">
                  <div className="row">
                    <h3 style={{ margin: 0 }}><Link href={`/events/${event.id}/tasks/${task.id}`}>{task.title}</Link></h3>
                    {task.dueDate ? <span className="muted">Due {formatDate(task.dueDate)}</span> : null}
                  </div>
                  {task.description ? <p className="prose muted">{task.description}</p> : null}
                  {canAssignTask(user, team.id) ? (
                    <AssignForm taskId={task.id} status="backlog" roster={roster} assigneeId={null} />
                  ) : null}
                </article>
              ))}
            </section>
          );
        })}
    </div>
  );
}
