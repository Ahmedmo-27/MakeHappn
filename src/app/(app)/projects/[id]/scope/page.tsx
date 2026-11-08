import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { getProjectById } from "@/services/projects";
import { STUDIO_PRODUCT_LABELS } from "@/lib/domain";

export default function ProjectScopePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project scope" />}>
      <ProjectScope params={params} />
    </Suspense>
  );
}

async function ProjectScope({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) notFound();

  return (
    <div className="stack" style={{ gap: "1.5rem", maxWidth: "800px" }}>
      <div className="card">
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Studio Products Contracted</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {project.products.map((prod) => (
            <div
              key={prod}
              style={{
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle, #e5e7eb)",
                background: "var(--bg-subtle, #f9fafb)",
              }}
            >
              <strong style={{ display: "block", color: "var(--accent)" }}>
                {STUDIO_PRODUCT_LABELS[prod]}
              </strong>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {prod === "turnkey_experience"
                  ? "Full end-to-end design, curation, fabrication & live operations"
                  : prod === "brand_design"
                    ? "2D Visual identity, guidelines, stationery & touchpoints"
                    : prod === "design_development"
                      ? "Spatial layout, 3D renderings, material selection & CAD drawings"
                      : prod === "curation"
                        ? "Artistic curation, talent sourcing & programming"
                        : prod === "brand_communication"
                          ? "Campaign storytelling, PR documentation & media"
                          : "Physical manufacturing, site installation & contractor supervision"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card stack" style={{ gap: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Strategic Scope & Brief</h2>

        <div>
          <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>
            CREATIVE BRIEF
          </label>
          <div style={{ padding: "0.75rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
            {project.brief || "No brief recorded yet."}
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>
            OBJECTIVES & SUCCESS CRITERIA
          </label>
          <div style={{ padding: "0.75rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
            {project.objectives || "No specific objectives specified."}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>
              TARGET AUDIENCE
            </label>
            <div style={{ padding: "0.75rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px", fontSize: "0.95rem" }}>
              {project.audience || "General Public"}
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: "0.25rem" }}>
              LOCATION / SITE
            </label>
            <div style={{ padding: "0.75rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px", fontSize: "0.95rem" }}>
              {project.location || "TBD / To be confirmed"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
