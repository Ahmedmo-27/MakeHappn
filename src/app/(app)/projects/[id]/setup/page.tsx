import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { ProjectSetupHeader } from "@/components/project-setup-header";
import { SubmitButton } from "@/components/submit-button";
import { saveProjectSetupAction } from "@/app/actions/project-setup";
import { orEmpty } from "@/lib/db";
import { readMessage } from "@/lib/format";
import { canManageProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { listDirectory } from "@/services/org";
import { getProjectById } from "@/services/projects";
import { INQUIRY_SCOPES, STUDIO_PRODUCT_LABELS, type StudioProduct } from "@/lib/domain";

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(8rem, 1fr) minmax(12rem, 2fr)",
  gap: "1rem",
  alignItems: "center",
} as const;

export default function ProjectSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project setup" />}>
      <OverviewAndScope params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OverviewAndScope({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const [project, directory] = await Promise.all([getProjectById(id), orEmpty(() => listDirectory(), null)]);
  if (!project) notFound();

  const flash = readMessage(query);
  const canEdit = canManageProject(user, project);
  const people = directory?.users ?? [];
  const creative = project.creativeLeadId as { _id?: unknown } | null;
  const selected = new Set<string>(project.scopeItems ?? []);
  const scopeOptions = [...new Set<string>([...INQUIRY_SCOPES, ...selected])];
  const template = (project.products as StudioProduct[]).map((p) => STUDIO_PRODUCT_LABELS[p]).join(", ");

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <ProjectSetupHeader project={project} />

      <form action={saveProjectSetupAction} className="card stack" style={{ gap: "1.25rem", maxWidth: "820px" }}>
        <input type="hidden" name="projectId" value={id} />
        <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Project configuration</h3>

        <div style={rowStyle}>
          <span className="muted">Template</span>
          <strong>{template}</strong>
        </div>
        <div style={rowStyle}>
          <label htmlFor="creativeLeadId" className="muted">Creative lead</label>
          <select
            id="creativeLeadId"
            name="creativeLeadId"
            className="select"
            defaultValue={creative?._id ? String(creative._id) : ""}
            disabled={!canEdit}
          >
            <option value="">Not set</option>
            {people.map((person) => (
              <option key={String(person._id)} value={String(person._id)}>
                {person.name}{person.title ? ` (${person.title})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Selected scope</label>
          <div className="check-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
            {scopeOptions.map((scope) => (
              <label key={scope}>
                <input type="checkbox" name="scopeItems" value={scope} defaultChecked={selected.has(scope)} disabled={!canEdit} />
                {scope}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="brief">Project brief - Overview</label>
          <textarea
            id="brief"
            name="brief"
            rows={6}
            className="textarea"
            placeholder="Describe the project, its goals and what the client expects"
            defaultValue={project.brief}
            disabled={!canEdit}
          />
        </div>

        {canEdit ? (
          <div className="form-actions">
            <SubmitButton>Save overview & scope</SubmitButton>
          </div>
        ) : (
          <p className="hint">Only the project lead can edit the project setup.</p>
        )}
      </form>
    </>
  );
}
