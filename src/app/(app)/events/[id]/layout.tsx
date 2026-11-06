import Link from "next/link";
import { Suspense } from "react";
import { addTeamAction, resendNoticesAction } from "@/app/actions/events";
import { PageFallback } from "@/components/banner";
import { EventTabs } from "@/components/event-tabs";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { canViewPerformance } from "@/lib/permissions";
import { listCatalog, getAccessibleEvent } from "@/services/events";

export default function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading the event" /></div>}>
      <EventFrame params={params}>{children}</EventFrame>
    </Suspense>
  );
}

async function EventFrame({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, event } = await getAccessibleEvent(id);
  const catalog = user.role === "owner" ? await listCatalog() : null;
  const available = catalog?.teams.filter((team) => !event.teamIds.includes(team.id)) ?? [];
  const pending = event.teams.filter((team) => !event.notifiedTeamIds.includes(team.id));

  return (
    <div className="page page-wide">
      <p className="kicker"><Link href="/dashboard">Experiences</Link></p>
      <header className="page-header">
        <div>
          <h1>{event.name}</h1>
          <p className="lede">{event.typeName} · {formatDate(event.start)} – {formatDate(event.end)}</p>
          <div className="pills">
            {event.teams.map((team) => <span key={team.id} className="pill">{team.name}</span>)}
          </div>
        </div>
      </header>
      {user.role === "owner" && pending.length > 0 ? (
        <form action={resendNoticesAction} className="panel row" style={{ marginBottom: "1rem" }}>
          <input type="hidden" name="eventId" value={event.id} />
          <p className="hint" style={{ margin: 0 }}>
            Assignment email has not been sent for {pending.map((team) => team.name).join(", ")}. The experience is saved either way.
          </p>
          <SubmitButton variant="ghost">Send pending notices</SubmitButton>
        </form>
      ) : null}
      {user.role === "owner" && available.length > 0 ? (
        <form action={addTeamAction} className="row" style={{ marginBottom: "0.5rem" }}>
          <input type="hidden" name="eventId" value={event.id} />
          <label className="field">
            <span>Add a team</span>
            <select className="select" name="teamId" defaultValue={available[0]?.id}>
              {available.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <p className="hint">The new team can then receive backlog tasks, and its leader is emailed.</p>
          </label>
          <SubmitButton variant="ghost">Add team</SubmitButton>
        </form>
      ) : null}
      <EventTabs eventId={event.id} showPerformance={canViewPerformance(user)} />
      {children}
    </div>
  );
}
