import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Sticker } from "@/components/brand/sticker";
import { Banner, PageFallback } from "@/components/banner";
import { readMessage } from "@/lib/format";
import { orEmpty } from "@/lib/db";
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

  const projects = await orEmpty(
    () => listProjects({
      stage: stageFilter,
      status: statusFilter,
      product: productFilter,
      userId: user.id,
      isExecutive: user.role === "owner",
    }),
    [],
  );

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
        <div className="empty empty-illu">
          <Sticker name="dog" className="sticker-plate empty-sticker" />
          <div>
            <p>No projects found matching the filter.</p>
            <p className="hint">Start a new project or clear the current product/stage filters.</p>
            <p className="row">
              <Link href="/projects/new" className="btn btn-primary">Start a project</Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="card-grid project-grid">
          {projects.map((proj, index) => {
            const stageInfo = STAGE_LABELS[proj.stage];
            const product = proj.products[0];

            return (
              <Link
                key={proj._id.toString()}
                className={`project-frame ${index % 2 === 0 ? "well-ink" : "well-nude"}`}
                href={`/projects/${proj._id.toString()}`}
              >
                <p className="project-frame-type">{product ? STUDIO_PRODUCT_LABELS[product] : "Project"}</p>
                <h2>{proj.name}</h2>
                <div className="project-frame-well" aria-hidden="true" />
                <p className="project-frame-index">
                  <span>{stageInfo.number}</span>
                  <span>{proj.code}</span>
                  <span>{PROJECT_STATUS_LABELS[proj.status]}</span>
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
