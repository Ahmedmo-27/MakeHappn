import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { loadDashboardBundle } from "@/components/dashboard/shared";
import { orEmpty } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { TEST_LANES, TEST_ROSTER } from "@/lib/test-roster";
import { listPeople } from "@/services/org";

export default function DashboardTeamPage() {
  return (
    <Suspense fallback={<PageFallback label="Loading team view" />}>
      <TeamView />
    </Suspense>
  );
}

async function TeamView() {
  await connection();
  const user = await getCurrentUser();
  const [{ rosterUsers, lanes, tasksByOwner, maxLoad }, directory] = await Promise.all([
    loadDashboardBundle(user),
    orEmpty(() => listPeople(), null),
  ]);
  const profileImages = new Map(directory?.people.map((person) => [person.id, person.profileImage]) ?? []);
  const teamRoster = rosterUsers.map((person) => ({
    ...person,
    profileImage: profileImages.get(person._id.toString()) ?? "",
  }));

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="section-index">Structure</span>
          <h2>Everyone has a lane</h2>
          <p>Projects move across lanes. Bars show each person&apos;s open accountable tasks.</p>
        </div>
        <div className="row" style={{ gap: "0.5rem" }}>
          <span className="badge badge-active">{(teamRoster.length ? teamRoster : TEST_ROSTER).length} people</span>
          {user.role === "owner" ? (
            <Link href="/teams" className="btn btn-ghost">Manage lanes <span className="arrow">→</span></Link>
          ) : null}
        </div>
      </div>
      <div className="lane-grid">
        {(lanes.length ? lanes : TEST_LANES.map((lane) => ({ _id: lane.id, name: lane.name }))).map((lane, i) => {
          const people = teamRoster.length
            ? teamRoster
            : TEST_ROSTER.map((person) => ({
                _id: person.id,
                name: person.name,
                title: person.title ?? "",
                laneIds: person.laneIds ?? [],
                profileImage: "",
              }));
          const members = people.filter((u) => {
            const laneIds = "laneIds" in u ? (u.laneIds ?? []) : [];
            return laneIds.some((id: { toString(): string }) => id.toString() === lane._id.toString());
          });
          return (
            <div key={lane._id.toString()} className={`panel lane-col lane-${i % 3}`}>
              <div className="lane-head">
                <span className="lane-dot" />
                <h3>{lane.name}</h3>
                <span className="mono muted">{String(members.length).padStart(2, "0")}</span>
              </div>
              <ul className="person-list">
                {members.map((m) => {
                  const load = tasksByOwner.get(m._id.toString()) ?? 0;
                  return (
                    <li key={m._id.toString()} className="person-row">
                      <EmployeeAvatar name={m.name} profileImage={m.profileImage} size={32} small />
                      <span className="person-meta">
                        <strong>{m.name}</strong>
                        <span>{m.title || "Studio member"}</span>
                        <span className="load"><i style={{ width: `${(load / maxLoad) * 100}%` }} /></span>
                      </span>
                      <span className="mono muted">{load}</span>
                    </li>
                  );
                })}
                {members.length === 0 ? <li className="muted">Nobody in this lane yet.</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
