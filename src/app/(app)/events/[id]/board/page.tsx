import Link from "next/link";
import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { Board } from "@/components/board";
import { getCurrentUser } from "@/lib/session";
import { listBoardTasks } from "@/services/tasks";

export default function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading the board" />}>
      <BoardScreen params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function BoardScreen({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const requested = typeof query.team === "string" ? query.team : undefined;
  const user = await getCurrentUser();
  const { event, tasks, teamFilter } = await listBoardTasks(id, user, requested ?? null);

  return (
    <div className="stack">
      <p className="hint">Drag a card to change its status. A reason is required before the move is saved. Backlog is not a column. It is the list of tasks that do not have a person yet.</p>
      {user.role === "member" ? (
        <p className="hint">A card without a drag handle belongs to someone else. You can move only tasks assigned to you.</p>
      ) : null}
      <dl className="legend">
        <div><dt>To Do</dt><dd>Assigned and ready to start.</dd></div>
        <div><dt>In Progress</dt><dd>Someone is doing it now.</dd></div>
        <div><dt>In Review</dt><dd>Waiting for a check.</dd></div>
        <div><dt>Blocked</dt><dd>Stuck. The reason says why.</dd></div>
        <div><dt>Done</dt><dd>Finished.</dd></div>
      </dl>
      {user.role === "owner" ? (
        <div className="pills">
          <Link className={!teamFilter ? "pill active" : "pill"} href={`/events/${event.id}/board`}>All teams</Link>
          {event.teams.map((team) => (
            <Link
              key={team.id}
              className={teamFilter === team.id ? "pill active" : "pill"}
              href={`/events/${event.id}/board?team=${team.id}`}
            >
              {team.name}
            </Link>
          ))}
        </div>
      ) : null}
      <Board eventId={event.id} tasks={tasks} showTeam={user.role === "owner" && !teamFilter} />
    </div>
  );
}
