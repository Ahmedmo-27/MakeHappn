import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { ProjectTabs } from "@/components/project-tabs";
import { orEmpty } from "@/lib/db";
import { canManageProject, canViewFinancials, canViewProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import {
  STAGE_LABELS,
  PROJECT_STATUS_LABELS,
  STUDIO_PRODUCT_LABELS,
  PROJECT_STAGES,
  type ProjectStage,
} from "@/lib/domain";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading project workspace" /></div>}>
      <ProjectFrame params={params}>{children}</ProjectFrame>
    </Suspense>
  );
}

async function ProjectFrame({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [user, project] = await Promise.all([getCurrentUser(), orEmpty(() => getProjectById(id), null)]);

  if (!project) notFound();
  if (!canViewProject(user, project)) notFound();

  const client = project.clientId as unknown as { name?: string; brandName?: string } | null;
  const lead = project.projectLeadId as unknown as { _id?: unknown; name?: string; title?: string } | null;
  const clientName = client?.brandName || client?.name || "Client";
  const stageInfo = STAGE_LABELS[project.stage];
  const currentStageIndex = PROJECT_STAGES.indexOf(project.stage);

  const canViewCommercials = canViewFinancials(user, project);
  const canEdit = canManageProject(user, project);

  return (
    <div className="page page-wide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <p className="kicker" style={{ margin: 0 }}>
          <Link href="/projects">← All Projects</Link>
        </p>
        <span style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em", color: "var(--accent)" }}>
          {project.code}
        </span>
      </div>

      <header className="page-header" style={{ marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <h1 className="title-compact" style={{ margin: 0 }}>{project.name}</h1>
            <span className={`status status-${project.status}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.2rem 0.5rem",
                borderRadius: "999px",
                background: project.health === "at_risk" ? "var(--danger-soft)" : project.health === "blocked" ? "var(--danger-soft)" : "var(--good-soft)",
                color: project.health === "at_risk" ? "var(--danger)" : project.health === "blocked" ? "var(--danger)" : "var(--good)",
              }}
            >
              {project.health.replace("_", " ").toUpperCase()}
            </span>
          </div>

          <p className="lede" style={{ margin: "0.25rem 0" }}>
            <strong>{clientName}</strong> · Project Lead: {lead?.name ?? "Sara M."}
          </p>

          <div className="pills" style={{ marginTop: "0.5rem" }}>
            {project.products.map((prod) => (
              <span key={prod} className="pill">
                {STUDIO_PRODUCT_LABELS[prod]}
              </span>
            ))}
          </div>
        </div>
        {canEdit ? (
          <Link className="btn btn-ghost" href={`/projects/${id}/edit`}>
            Edit project
          </Link>
        ) : null}
      </header>

      {/* 11-Stage Pipeline Visual Tracker. Not a .card: cards invert ink to black, and this strip sits on the black canvas. */}
      <div className="stage-pipeline">
        <div className="stage-pipeline-meta">
          <span className="stage-pipeline-name">
            STAGE {stageInfo.number}: {stageInfo.title.toUpperCase()}
          </span>
          <span className="stage-pipeline-phase">
            Macro Phase: <strong>{stageInfo.macroPhase}</strong>
          </span>
        </div>

        <div className="stage-track" role="img" aria-label={`Stage ${stageInfo.number}: ${stageInfo.title}`}>
          {PROJECT_STAGES.map((st, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isBypassed = project.bypassedStages?.includes(st as ProjectStage);
            const state = isBypassed ? " skipped" : isCompleted ? " done" : isCurrent ? " current" : "";

            return (
              <span
                key={st}
                className={`seg${state}`}
                title={`Stage ${STAGE_LABELS[st].number}: ${STAGE_LABELS[st].short}${isBypassed ? " (Bypassed)" : ""}`}
              />
            );
          })}
        </div>
      </div>

      <ProjectTabs projectId={id} canViewCommercials={canViewCommercials} />

      <Suspense fallback={<PageFallback label="Loading tab content" />}>
        {children}
      </Suspense>
    </div>
  );
}
