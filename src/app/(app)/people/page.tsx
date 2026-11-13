import { Suspense } from "react";
import { Sticker } from "@/components/brand/sticker";
import { Banner, PageFallback } from "@/components/banner";
import { PersonForm } from "@/components/person-form";
import { SubmitButton } from "@/components/submit-button";
import { roleLabel } from "@/lib/domain";
import { formatDate, readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { listPeople } from "@/services/org";
import { createReviewFormAction, setLeaveFormAction } from "@/app/actions/studio-ops";
import { listLeave, listReviews } from "@/services/studio-ops";

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
  const [flash, data, leave, reviews] = await Promise.all([
    searchParams.then(readMessage),
    listPeople(),
    listLeave(),
    listReviews(),
  ]);
  const nameOf = new Map(data.people.map((person) => [person.id, person.name]));

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <Sticker name="meet-tape" className="people-tape" />
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
          <PersonForm teams={data.teams} people={data.people} />
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
      </div>

      <section className="panel" style={{ marginTop: "1.5rem" }}>
        <h2>Organization</h2>
        {data.people.map((person) => (
          <p key={person.id} className="muted">
            {person.name}{person.reportsToId ? ` reports to ${nameOf.get(person.reportsToId)}` : " · studio lead"} · {person.title || roleLabel(person.role)}
          </p>
        ))}
      </section>

      <div className="split" style={{ marginTop: "1.5rem" }}>
        <section className="panel">
          <h2>Leave</h2>
          {leave.map((item) => {
            const person = item.userId as unknown as { name?: string } | null;
            return (
              <div key={String(item._id)} className="row" style={{ marginBottom: "0.6rem" }}>
                <span>{person?.name} · {formatDate(item.startDate)} – {formatDate(item.endDate)} · {item.status}</span>
                {item.status === "requested" ? (
                  <form action={setLeaveFormAction} className="row">
                    <input type="hidden" name="id" value={String(item._id)} />
                    <button className="btn btn-ghost" name="status" value="approved" type="submit">Approve</button>
                    <button className="btn btn-ghost" name="status" value="declined" type="submit">Decline</button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </section>
        <section className="card form-card">
          <h2>Performance review</h2>
          {reviews.map((review) => {
            const person = review.userId as unknown as { name?: string } | null;
            return <p key={String(review._id)} className="muted">{person?.name} · {review.period} · {review.rating}/5 · {review.kpiNotes}</p>;
          })}
          <form action={createReviewFormAction} className="stack">
            <label className="field">
              <span>Person</span>
              <select className="select" name="userId" required>
                {data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Period</span><input className="input" name="period" placeholder="2026 Q4" required /></label>
            <label className="field"><span>KPIs</span><textarea className="textarea" name="kpiNotes" rows={2} /></label>
            <label className="field"><span>Training and development</span><textarea className="textarea" name="development" rows={2} /></label>
            <label className="field"><span>Rating 1–5</span><input className="input" name="rating" type="number" min="1" max="5" defaultValue={3} /></label>
            <SubmitButton>Save review</SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
