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
      {user.role === "member" ? (
        <p className="hint">You can move only tasks assigned to you.</p>
      ) : null}
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
