import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { CountLine, Meter, Percent } from "@/components/stats";
import { roleLabel } from "@/lib/domain";
import { canViewPerformance } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getAccessibleEvent } from "@/services/events";
import { eventPerformance } from "@/services/performance";

export default function PerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading performance" />}>
      <Performance params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Performance({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!canViewPerformance(user)) redirect(`/events/${id}/board`);
  const { event } = await getAccessibleEvent(id);
  const stats = await eventPerformance(event.id, event.teams);
  const requested = typeof query.team === "string" ? query.team : undefined;
  const focusId = user.role === "leader" ? user.teamId : requested;
  const focus = stats.find((team) => team.teamId === focusId) ?? null;

  return (
    <div className="stack">
      <p className="lede">
        Done percentage is done tasks divided by every task in scope. A person is scored only on tasks assigned to them. A team score also includes unassigned backlog. Zero tasks shows 0%, so a light workload is obvious.
      </p>
      <p className="hint">Done is the percent. Workload is how many of those tasks are done. Statuses is the mix.</p>
      {user.role === "owner" && !focus ? (
        <div className="card-grid">
          {stats.map((team) => (
            <article key={team.teamId} className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 style={{ margin: 0 }}>{team.name}</h2>
                <Percent counts={team.counts} />
              </div>
              <Meter counts={team.counts} />
              <CountLine counts={team.counts} />
              <Link className="btn btn-ghost" href={`/events/${event.id}/performance?team=${team.teamId}`}>View members</Link>
              <p className="hint">Opens this team&apos;s people and their scores.</p>
            </article>
          ))}
        </div>
      ) : null}
      {focus ? (
        <section className="stack">
          {user.role === "owner" ? <Link href={`/events/${event.id}/performance`}>All teams</Link> : null}
          <div className="panel stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>{focus.name}</h2>
              <Percent counts={focus.counts} />
            </div>
            <Meter counts={focus.counts} />
            <CountLine counts={focus.counts} />
          </div>
          <div className="table-wrap panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th title="Done tasks divided by tasks in scope">Done</th>
                  <th title="Done tasks out of tasks in scope">Workload</th>
                  <th title="How many tasks sit in each status">Statuses</th>
                </tr>
              </thead>
              <tbody>
                {focus.people.map((person) => (
                  <tr key={person.userId ?? "unassigned"}>
                    <td>
                      <strong>{person.name}</strong>
                      <div className="muted">{person.role === "unassigned" ? "Not assigned" : roleLabel(person.role)}</div>
                    </td>
                    <td className="display" style={{ fontSize: "1.6rem" }}>{person.percent}%</td>
                    <td>{person.counts.done} / {person.total}</td>
                    <td><CountLine counts={person.counts} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
