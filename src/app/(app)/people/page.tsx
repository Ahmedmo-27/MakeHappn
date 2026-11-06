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
          <h1>People</h1>
          <p className="lede">Add the people who will sign in. A member works on one team, a team has one leader, and an owner sits outside the teams.</p>
        </div>
      </header>
      <div className="grid-2">
        <section className="panel">
          <h2>Add a person</h2>
          <PersonForm teams={data.teams} />
        </section>
        <section className="stack">
          {data.people.map((person) => (
            <article key={person.id} className="panel">
              <div className="row">
                <h2 style={{ margin: 0 }}>{person.name}</h2>
                <span className={`badge badge-${person.role}`}>{roleLabel(person.role)}</span>
              </div>
              <p className="muted">{person.email}{person.teamName ? ` · ${person.teamName}` : ""}</p>
              <details>
                <summary>Edit</summary>
                <PersonForm teams={data.teams} person={person} />
              </details>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
