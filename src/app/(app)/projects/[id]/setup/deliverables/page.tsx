import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { ProjectSetupHeader } from "@/components/project-setup-header";
import { SubmitButton } from "@/components/submit-button";
import {
  notifyProjectTeamAction,
  saveProjectDeliverablesAction,
  scheduleProjectKickoffAction,
} from "@/app/actions/project-setup";
import { readMessage } from "@/lib/format";
import { canManageProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { PROJECT_SETUP_PHASES } from "@/lib/domain";
import { getProjectById } from "@/services/projects";

export default function ProjectDeliverablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project deliverables" />}>
      <DeliverablesTab params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function DeliverablesTab({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const project = await getProjectById(id);
  if (!project) notFound();

  const flash = readMessage(query);
  const canEdit = canManageProject(user, project);
  const savedPhases = new Map((project.setupPhases ?? []).map((phase: {
    name: string;
    deliverables?: string;
  }) => [phase.name, phase]));
  const kickoffAt = project.kickoffAt ? new Date(project.kickoffAt).toISOString().slice(0, 16) : "";

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <ProjectSetupHeader project={project} />

      <form action={saveProjectDeliverablesAction} className="card stack" style={{ gap: "1rem", maxWidth: "900px" }}>
        <input type="hidden" name="projectId" value={id} />
        <div>
          <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Deliverables</h3>
          <p className="hint" style={{ marginBottom: 0 }}>Add the deliverables for each project phase.</p>
        </div>
        {PROJECT_SETUP_PHASES.map((name, index) => {
          const phase = savedPhases.get(name) as { deliverables?: string } | undefined;
          return (
            <div className="form-group" key={name}>
              <label htmlFor={`deliverables-${index}`}>{name}</label>
              <textarea
                id={`deliverables-${index}`}
                name={`deliverables-${index}`}
                rows={3}
                maxLength={5000}
                className="textarea"
                placeholder="Add deliverables for this phase"
                defaultValue={phase?.deliverables ?? ""}
                disabled={!canEdit}
              />
            </div>
          );
        })}
        {canEdit ? <div className="form-actions"><SubmitButton>Save deliverables</SubmitButton></div> : null}
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "1rem", maxWidth: "900px" }}>
        <form action={scheduleProjectKickoffAction} className="card stack" style={{ gap: "0.85rem", display: "flex", flexDirection: "column" }}>
          <input type="hidden" name="projectId" value={id} />
          <h3 style={{ margin: 0 }}>Schedule kick-off meeting</h3>
          <div className="form-group" style={{ maxWidth: "24rem" }}>
            <label htmlFor="kickoffAt">Kick-off date and time</label>
            <input id="kickoffAt" name="kickoffAt" type="datetime-local" required className="input" defaultValue={kickoffAt} disabled={!canEdit} />
          </div>
          {canEdit ? <div className="form-actions" style={{ marginTop: "auto" }}><SubmitButton>Schedule in Google Calendar</SubmitButton></div> : null}
        </form>

        <form action={notifyProjectTeamAction} className="card stack" style={{ gap: "0.85rem", display: "flex", flexDirection: "column" }}>
          <input type="hidden" name="projectId" value={id} />
          <h3 style={{ margin: 0 }}>Notify the team</h3>
          {canEdit ? <div className="form-actions" style={{ marginTop: "auto" }}><SubmitButton variant="ghost">Notify the team</SubmitButton></div> : null}
        </form>
      </div>
    </>
  );
}
