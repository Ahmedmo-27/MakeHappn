import Link from "next/link";
import { Suspense } from "react";
import { Banner, PageFallback } from "@/components/banner";
import { CountLine, Meter, Percent } from "@/components/stats";
import { STATUS_LABEL } from "@/lib/domain";
import { formatDate, readMessage } from "@/lib/format";
import { roleLabel } from "@/lib/domain";
import { getCurrentUser } from "@/lib/session";
import { Team } from "@/models/Team";
import { listEventsForUser } from "@/services/events";
import { summarizeEvents } from "@/services/performance";
import { listOpenTasks } from "@/services/tasks";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading the dashboard" /></div>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, flash] = await Promise.all([getCurrentUser(), searchParams.then(readMessage)]);
  const events = await listEventsForUser(user.role, user.teamId);
  const summaries = await summarizeEvents(events.map((event) => event.id));
  const openTasks = user.role === "owner" ? [] : await listOpenTasks(user.id);
  const team = user.teamId ? await Team.findById(user.teamId).select("name") : null;
  const teamName = team?.name ?? "your team";

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">{roleLabel(user.role)}</p>
          <h1>Hello, {user.name.split(" ")[0]}</h1>
          <p className="lede">
            {user.role === "owner"
              ? events.length === 0
                ? "You set up the studio. Add people, give each crew one leader, then start an experience and put work on its backlog."
                : "You set up the studio. Open an experience to add backlog work. Team leaders assign that work to their crew."
              : user.role === "leader"
                ? `You lead ${teamName}. Open an experience, assign backlog work to your crew, then follow their progress on Performance.`
                : "Open a task assigned to you. Every status change asks for a reason. You cannot move someone else's card."}
          </p>
        </div>
        {user.role === "owner" ? <Link className="btn btn-primary" href="/events/new">Start an experience</Link> : null}
      </header>

      {openTasks.length > 0 ? (
        <section className="stack" style={{ marginBottom: "1.5rem" }}>
          <h2>Your open tasks</h2>
          <p className="hint">Open a task to change its status. A reason is required, and it is kept in the task history.</p>
          <div className="card-grid">
            {openTasks.map((task) => (
              <Link key={task.id} className="event-card" href={`/events/${task.eventId}/tasks/${task.id}`}>
                <span className={`status status-${task.status}`}>{STATUS_LABEL[task.status]}</span>
                <h2>{task.title}</h2>
                <p className="muted">{task.eventName}{task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="stack">
        <h2>Experiences</h2>
        {events.length === 0 ? (
          <div className="empty">
            <p>No experiences yet.</p>
            {user.role === "owner" ? (
              <>
                <p className="hint">Add people, set one leader on each crew that will work, then start the experience.</p>
                <p className="row">
                  <Link href="/people">People</Link>
                  <Link href="/teams">Teams</Link>
                  <Link href="/events/new">Start an experience</Link>
                </p>
              </>
            ) : (
              <p className="hint">When the owner assigns {teamName}, the experience shows up here.</p>
            )}
          </div>
        ) : (
          <div className="card-grid">
            {events.map((event) => {
              const counts = summaries.get(event.id)!;
              return (
                <Link key={event.id} className="event-card" href={`/events/${event.id}/backlog`}>
                  <div className="row">
                    <span className="badge">{event.typeName}</span>
                    <span className="muted">{formatDate(event.start)} – {formatDate(event.end)}</span>
                  </div>
                  <h2>{event.name}</h2>
                  <p className="hint">Done work on this experience.</p>
                  <div className="pills">
                    {event.teams.map((team) => <span key={team.id} className="pill">{team.name}</span>)}
                  </div>
                  <Percent counts={counts} />
                  <Meter counts={counts} />
                  <CountLine counts={counts} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
