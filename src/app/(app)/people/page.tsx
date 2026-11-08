import { Suspense } from "react";
import { Banner, PageFallback } from "@/components/banner";
import { PersonForm } from "@/components/person-form";
import { roleLabel } from "@/lib/domain";
import { readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { listPeople } from "@/services/org";

export default function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading people" /></div>}>
      <People searchParams={searchParams} />
    </Suspense>
  );
}

async function People({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const [flash, data] = await Promise.all([searchParams.then(readMessage), listPeople()]);

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Studio</p>
          <h1 className="title-compact">People</h1>
          <p className="lede">Add the people who will sign in. A member works on one team, a team has one leader, and an owner sits outside the teams.</p>
        </div>
      </header>
      <div className="grid-2">
        <section className="card form-card">
          <div className="form-header" style={{ marginBottom: "1rem" }}>
            <h2 className="form-title">Add a person</h2>
            <p className="form-subtitle">Invite or register studio team members, leads, and directors.</p>
          </div>
          <PersonForm teams={data.teams} />
        </section>
        <section className="stack">
          {data.people.map((person) => (
            <article key={person.id} className="card stack" style={{ gap: "0.6rem" }}>
              <div className="row">
                <h2 style={{ margin: 0 }}>{person.name}</h2>
                <span className={`badge badge-${person.role}`}>{roleLabel(person.role)}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>
                {person.title ? <strong>{person.title} · </strong> : null}
                {person.email}
                {person.teamName ? ` · ${person.teamName}` : ""}
              </p>
              <details className="disclosure" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                <summary className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>Edit Person</summary>
                <div style={{ marginTop: "0.75rem", padding: "1.25rem", background: "white", borderRadius: "14px", border: "1px solid var(--line)" }}>
                  <PersonForm teams={data.teams} person={person} />
                </div>
              </details>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
