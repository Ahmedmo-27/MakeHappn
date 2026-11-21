import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { ProjectSetupHeader } from "@/components/project-setup-header";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { addProjectMemberAction } from "@/app/actions/project-setup";
import { formatDateTime, readMessage } from "@/lib/format";
import { canManageProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getProjectById, getProjectTeam } from "@/services/projects";
import { AVAILABILITY_LABELS, type AvailabilityStatus } from "@/lib/domain";

const STATUS_BADGE: Record<AvailabilityStatus, string> = {
  available: "badge-good",
  busy: "badge-overdue",
  in_meeting: "badge-info",
  out_of_office: "badge-danger",
  on_leave: "badge-danger",
};

export default function ProjectTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project team" />}>
      <TeamTab params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function TeamTab({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const [project, roster] = await Promise.all([
    getProjectById(id),
    getProjectTeam(id),
  ]);
  if (!project) notFound();

  const flash = readMessage(query);
  const canEdit = canManageProject(user, project);

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <ProjectSetupHeader project={project} />

      <section className="card stack" style={{ gap: "1rem", maxWidth: "820px" }}>
        <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Project members</h3>
        <p className="hint">Choose employees from one list. Team assignments are not required.</p>

        {canEdit ? (
          <form action={addProjectMemberAction} className="row" style={{ gap: "0.6rem" }}>
            <input type="hidden" name="projectId" value={id} />
            <label htmlFor="project-member" className="sr-only">Choose a project member</label>
            <select
              id="project-member"
              name="userId"
              required
              defaultValue=""
              className="select"
              style={{ flex: 1, minWidth: "14rem" }}
              aria-label="Choose a project member"
              disabled={roster.candidates.length === 0}
            >
              <option value="" disabled>
                {roster.candidates.length ? "Choose a member" : "All employees are already added"}
              </option>
              {roster.candidates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.title || "No title"} · {AVAILABILITY_LABELS[member.availability]}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary" disabled={roster.candidates.length === 0}>
              Add member
            </button>
          </form>
        ) : null}

        {roster.members.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Title</th><th>Member status</th></tr></thead>
              <tbody>{roster.members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="row" style={{ gap: "0.6rem" }}>
                      <EmployeeAvatar name={member.name} profileImage={member.profileImage} size={32} small />
                      <span>
                        <strong>{member.name}</strong>{member.isLead ? <span className="muted"> · Project lead</span> : null}
                      </span>
                    </div>
                  </td>
                  <td>{member.title || "—"}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[member.availability]}`}>{AVAILABILITY_LABELS[member.availability]}</span>
                    {member.availabilityNote ? <div className="muted" style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}>{member.availabilityNote}</div> : null}
                    {member.availabilityUpdatedAt && member.availability !== "available" ? (
                      <div className="muted" style={{ fontSize: "0.72rem" }}>Updated {formatDateTime(member.availabilityUpdatedAt)}</div>
                    ) : null}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="hint">No project members have been added.</p>}
      </section>
    </>
  );
}
