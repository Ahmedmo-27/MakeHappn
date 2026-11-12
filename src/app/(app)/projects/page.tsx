import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listProjects } from "@/services/projects";
import {
  STAGE_LABELS,
  PROJECT_STATUS_LABELS,
  STUDIO_PRODUCT_LABELS,
  type ProjectStage,
  type ProjectStatus,
  type StudioProduct,
} from "@/lib/domain";

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading projects" /></div>}>
      <ProjectsList searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectsList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);

  const stageFilter = typeof params.stage === "string" ? (params.stage as ProjectStage) : undefined;
  const statusFilter = typeof params.status === "string" ? (params.status as ProjectStatus) : undefined;
  const productFilter = typeof params.product === "string" ? (params.product as StudioProduct) : undefined;

  const projects = await listProjects({
    stage: stageFilter,
    status: statusFilter,
    product: productFilter,
    userId: user.id,
    isExecutive: user.role === "owner",
  });

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Studio Portfolio</p>
          <h1>Projects</h1>
          <p className="lede">
            Enterprise creative and experiential projects. Track stage gates, products, and multidisciplinary delivery across lanes.
          </p>
        </div>
        <div>
          <Link className="btn btn-primary" href="/projects/new">
            New Project
          </Link>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <span className="muted" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Filter by Product:</span>
          <Link
            href="/projects"
            className={`badge ${!productFilter ? "badge-active" : ""}`}
            style={{ textDecoration: "none" }}
          >
            All Products
          </Link>
          {(Object.keys(STUDIO_PRODUCT_LABELS) as StudioProduct[]).map((prod) => (
            <Link
              key={prod}
              href={`/projects?product=${prod}`}
              className={`badge ${productFilter === prod ? "badge-active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              {STUDIO_PRODUCT_LABELS[prod]}
            </Link>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <p>No projects found matching the filter.</p>
          <p className="hint">Start a new project or clear the current product/stage filters.</p>
          <p className="row">
            <Link href="/projects/new" className="btn btn-primary">Start a project</Link>
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((proj) => {
            const stageInfo = STAGE_LABELS[proj.stage];
            const client = proj.clientId as unknown as { name?: string; brandName?: string } | null;
            const lead = proj.projectLeadId as unknown as { name?: string; title?: string } | null;
            const clientName = client?.brandName || client?.name || "Client";

            return (
              <Link
                key={proj._id.toString()}
                className="event-card"
                href={`/projects/${proj._id.toString()}`}
                style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.05em", color: "var(--accent)" }}>
                    {proj.code}
                  </span>
                  <span className={`status status-${proj.status}`}>
                    {PROJECT_STATUS_LABELS[proj.status]}
                  </span>
                </div>

                <h2 style={{ margin: "0.25rem 0", fontSize: "1.15rem" }}>{proj.name}</h2>
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  <strong>{clientName}</strong> · Lead: {lead?.name ?? "Studio Lead"}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", margin: "0.25rem 0" }}>
                  {proj.products.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        background: "var(--bg-subtle, var(--surface-2))",
                        border: "1px solid var(--border-subtle, var(--line))",
                      }}
                    >
                      {STUDIO_PRODUCT_LABELS[p]}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--border-subtle, var(--line))",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                  }}
                >
                  <span className="muted">
                    Stage {stageInfo.number}: {stageInfo.short}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: proj.health === "at_risk" ? "var(--danger)" : proj.health === "blocked" ? "var(--danger)" : "var(--good)",
                    }}
                  >
                    {proj.health.replace("_", " ")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
