import Link from "next/link";
import { Suspense } from "react";
import { createTeamAction, promoteLeaderAction, renameTeamAction } from "@/app/actions/org";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { roleLabel } from "@/lib/domain";
import { readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { listTeamsWithPeople } from "@/services/org";

export default function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading teams" /></div>}>
      <Teams searchParams={searchParams} />
    </Suspense>
  );
}

async function Teams({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const [flash, teams] = await Promise.all([searchParams.then(readMessage), listTeamsWithPeople()]);

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Studio Organization</p>
          <h1 className="title-compact">Lanes & Operating Structure</h1>
          <p className="lede">
            A multidisciplinary team built around three connected functions — Vision & Design, Project & Delivery, and Communication.
            &ldquo;Everyone has a lane · Projects move across lanes · Ownership is clear at every handover.&rdquo;
          </p>
        </div>
      </header>
      <form action={createTeamAction} className="row card form-card" style={{ maxWidth: "640px", alignItems: "flex-end", gap: "0.85rem" }}>
        <label className="field" style={{ flex: 1 }}>
          <span>New team / studio lane</span>
          <input className="input" name="name" required placeholder="e.g. Vision & Design" />
        </label>
        <SubmitButton>Add lane</SubmitButton>
      </form>
      <div className="stack" style={{ marginTop: "1.25rem" }}>
        {teams.map((team) => (
          <article key={team.id} className="card stack" style={{ gap: "0.85rem" }}>
            <form action={renameTeamAction} className="row" style={{ alignItems: "flex-end", gap: "0.75rem" }}>
              <input type="hidden" name="teamId" value={team.id} />
              <label className="field" style={{ flex: 1 }}>
                <span>Name</span>
                <input className="input" name="name" defaultValue={team.name} required />
              </label>
              <SubmitButton variant="ghost">Rename</SubmitButton>
            </form>
            {team.people.length === 0 ? <p className="hint">No one is on this team yet. <Link href="/people">Add them from People.</Link></p> : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Role</th><th></th></tr>
                  </thead>
                  <tbody>
                    {team.people.map((person) => (
                      <tr key={person.id}>
                        <td>{person.name}<div className="muted">{person.email}</div></td>
                        <td><span className={`badge badge-${person.role}`}>{roleLabel(person.role)}</span></td>
                        <td>
                          {person.role === "leader" ? <span className="muted">Leader</span> : (
                            <form action={promoteLeaderAction}>
                              <input type="hidden" name="teamId" value={team.id} />
                              <input type="hidden" name="userId" value={person.id} />
                              <SubmitButton variant="ghost">Make leader</SubmitButton>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
