import Link from "next/link";
import { Suspense } from "react";
import { Banner, PageFallback } from "@/components/banner";
import { PersonForm } from "@/components/person-form";
import { FUNCTIONAL_ROLE_LABELS, roleLabel } from "@/lib/domain";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { testPeopleView } from "@/lib/test-roster";
import { listPeople } from "@/services/org";

export default function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading people" />}>
      <PeopleDirectory searchParams={searchParams} />
    </Suspense>
  );
}

async function PeopleDirectory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const [flash, loaded] = await Promise.all([
    searchParams.then(readMessage),
    orEmpty(() => listPeople(), null),
  ]);
  const data = loaded ?? testPeopleView();
  const nameOf = new Map(data.people.map((person) => [person.id, person.name]));

  return (
    <>
      <Banner error={flash.error ?? (loaded ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link href="/people/new" className="btn btn-primary">Add a person</Link>
      </div>
      <section className="stack">
        {data.people.map((person) => (
          <article key={person.id} className="card stack" style={{ gap: "0.6rem" }}>
            <div className="row">
              <h2 style={{ margin: 0 }}>{person.name}</h2>
              <span className={`badge badge-${person.role}`}>{roleLabel(person.role)}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {person.title ? <strong>{person.title} · </strong> : null}
              {person.functionalRoles?.length ? (
                <span>{person.functionalRoles.map((role) => FUNCTIONAL_ROLE_LABELS[role]).join(", ")} · </span>
              ) : null}
              {person.jobDescription ? <span> · {person.jobDescription}</span> : null}
              {person.reportsToId ? <span> · reports to {nameOf.get(person.reportsToId)}</span> : null}
              <span> · {person.weeklyCapacityHours}h / week</span>
              {person.email}
              {person.teamName ? ` · ${person.teamName}` : ""}
            </p>
            <details className="disclosure" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
              <summary className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>Edit Person</summary>
              <div style={{ marginTop: "0.75rem", padding: "1.25rem", background: "var(--surface-2)", borderRadius: "14px", border: "1px solid var(--line)" }}>
                <PersonForm teams={data.teams} people={data.people} person={person} />
              </div>
            </details>
          </article>
        ))}
      </section>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <h2>Organization</h2>
        {data.people.map((person) => (
          <p key={person.id} className="muted">
            {person.name}{person.reportsToId ? ` reports to ${nameOf.get(person.reportsToId)}` : " · studio lead"} · {person.title || roleLabel(person.role)}
          </p>
        ))}
      </section>
    </>
  );
}
