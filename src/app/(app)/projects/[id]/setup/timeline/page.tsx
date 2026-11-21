import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { ProjectSetupHeader } from "@/components/project-setup-header";
import { SubmitButton } from "@/components/submit-button";
import { DatePickerInput } from "@/components/date-picker-input";
import { saveProjectTimelineAction } from "@/app/actions/project-setup";
import { readMessage, toDateInput } from "@/lib/format";
import { countWorkingDays } from "@/lib/project-timeline";
import { canManageProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { PROJECT_SETUP_PHASES } from "@/lib/domain";
import { getProjectById, getProjectTeam } from "@/services/projects";

export default function ProjectTimelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project timeline" />}>
      <TimelineTab params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function TimelineTab({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const [project, team] = await Promise.all([getProjectById(id), getProjectTeam(id)]);
  if (!project) notFound();

  const flash = readMessage(query);
  const canEdit = canManageProject(user, project);
  const savedPhases = new Map((project.setupPhases ?? []).map((phase: {
    name: string;
    durationDays?: number;
    ownerId?: { toString(): string } | string | null;
  }) => [phase.name, phase]));
  const startDate = project.startDate ? toDateInput(project.startDate) : "";
  const deliveryDate = project.deliveryDate ? toDateInput(project.deliveryDate) : "";
  const workdays = startDate && deliveryDate ? countWorkingDays(startDate, deliveryDate) : null;

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <ProjectSetupHeader project={project} />

      <form action={saveProjectTimelineAction} className="card stack" style={{ gap: "1.25rem", maxWidth: "900px" }}>
        <input type="hidden" name="projectId" value={id} />
        <div>
          <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Timeline &amp; Phases</h3>
          <p className="hint" style={{ marginBottom: 0 }}>
            Set the project dates and fill in only the phases that apply. Duration and owner are optional for each phase.
          </p>
        </div>

        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="startDate">Project start date</label>
            <DatePickerInput
              id="startDate"
              name="startDate"
              label="Project start date"
              defaultValue={startDate}
              disabled={!canEdit}
            />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryDate">Delivery date</label>
            <DatePickerInput
              id="deliveryDate"
              name="deliveryDate"
              label="Delivery date"
              defaultValue={deliveryDate}
              disabled={!canEdit}
            />
          </div>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          {workdays === null
            ? "Working days are counted Sunday through Thursday once both dates are set."
            : `${workdays} working ${workdays === 1 ? "day" : "days"} · Sunday–Thursday`}
        </p>

        <div className="stack" style={{ gap: "0.75rem" }}>
          {PROJECT_SETUP_PHASES.map((name, index) => {
            const phase = savedPhases.get(name) as {
              durationDays?: number;
              ownerId?: { toString(): string } | string | null;
            } | undefined;
            const ownerId = phase?.ownerId ? String(phase.ownerId) : "";
            return (
              <section key={name} className="card stack" style={{ gap: "0.8rem" }}>
                <h4 style={{ margin: 0 }}>{name}</h4>
                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "minmax(9rem, 1fr) minmax(12rem, 2fr)", gap: "1rem" }}>
                  <div className="form-group">
                    <label htmlFor={`duration-${index}`}>Duration (days, optional)</label>
                    <input
                      id={`duration-${index}`}
                      name={`duration-${index}`}
                      type="number"
                      min="1"
                      max="3650"
                      step="1"
                      className="input"
                      defaultValue={phase?.durationDays || ""}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`owner-${index}`}>Phase owner (optional)</label>
                    <select id={`owner-${index}`} name={`owner-${index}`} className="select" defaultValue={ownerId} disabled={!canEdit}>
                      <option value="">Not assigned</option>
                      {team.members.map((person) => (
                        <option key={person.id} value={person.id}>{person.name}{person.title ? ` · ${person.title}` : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {canEdit ? <div className="form-actions"><SubmitButton>Save timeline &amp; phases</SubmitButton></div> : (
          <p className="hint">Only the assigned project lead or studio leadership can edit this setup.</p>
        )}
      </form>
    </>
  );
}
