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
          <p className="kicker">Studio</p>
          <h1>Teams</h1>
          <p className="lede">Each team has one leader and any number of members. Make leader replaces the current leader. The previous leader stays on the team as a member.</p>
        </div>
      </header>
      <form action={createTeamAction} className="row panel">
        <label className="field" style={{ flex: 1 }}>
          <span>New team</span>
          <input className="input" name="name" required placeholder="Design" />
        </label>
        <SubmitButton>Add team</SubmitButton>
      </form>
      <div className="stack" style={{ marginTop: "1rem" }}>
        {teams.map((team) => (
          <article key={team.id} className="panel">
            <form action={renameTeamAction} className="row">
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
