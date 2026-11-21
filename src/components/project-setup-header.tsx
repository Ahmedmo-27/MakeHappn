import { formatDate } from "@/lib/format";
import { STUDIO_PRODUCT_LABELS, type StudioProduct } from "@/lib/domain";
import type { ProjectRecord } from "@/services/projects";

type Named = { _id?: unknown; name?: string } | null;

export function isSetupComplete(project: ProjectRecord) {
  const phases = project.setupPhases as Array<{ durationDays?: number; ownerId?: unknown }> | undefined;
  return Boolean(
    project.startDate &&
      project.deliveryDate &&
      project.brief &&
      project.creativeLeadId &&
      (project.scopeItems?.length ?? 0) > 0 &&
      phases?.length === 6 &&
      phases.every((phase) => Number(phase.durationDays) >= 1 && Boolean(phase.ownerId)),
  );
}

/** Dark summary card shown at the top of the project setup tabs. */
export function ProjectSetupHeader({ project }: { project: ProjectRecord }) {
  const client = project.clientId as { name?: string; brandName?: string } | null;
  const owner = project.projectLeadId as Named;
  const creative = project.creativeLeadId as Named;
  const template = (project.products as StudioProduct[]).map((p) => STUDIO_PRODUCT_LABELS[p]).join(", ");
  const complete = isSetupComplete(project);

  return (
    <div
      style={{
        background: "#1f2a33",
        color: "#fff",
        borderRadius: "20px",
        padding: "1.4rem 1.6rem",
        display: "grid",
        gap: "0.45rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <span
          style={{
            background: complete ? "rgba(26,143,82,0.28)" : "rgba(59,201,108,0.16)",
            color: "#4ade80",
            borderRadius: "999px",
            padding: "0.25rem 0.8rem",
            fontSize: "0.82rem",
            fontWeight: 600,
          }}
        >
          {complete ? "Setup complete" : "Proposed · Ready for setup"}
        </span>
        <span style={{ color: "#aab4bc", fontWeight: 600 }}>{project.code}</span>
      </div>
      <h2 style={{ margin: "0.4rem 0 0", fontSize: "1.9rem", color: "#fff" }}>{project.name}</h2>
      <p style={{ margin: 0, color: "#aab4bc" }}>
        {client?.brandName || client?.name || "Client"} · {template}
      </p>
      <p style={{ margin: "0.2rem 0 0", color: "#d4dbe0", fontSize: "0.9rem" }}>
        Scope: {project.scopeItems?.length ? project.scopeItems.join(" · ") : "Not set"}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "0.5rem" }}>
        <div>
          <div style={{ color: "#aab4bc", fontSize: "0.9rem" }}>Project Owner</div>
          <strong style={{ fontSize: "1.1rem" }}>{owner?.name ?? "Unassigned"}</strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#aab4bc", fontSize: "0.9rem" }}>Creative Lead</div>
          <strong style={{ fontSize: "1.1rem" }}>{creative?.name ?? "Not set"}</strong>
        </div>
      </div>
      {project.startDate || project.deliveryDate ? (
        <p style={{ margin: "0.25rem 0 0", color: "#aab4bc", fontSize: "0.85rem" }}>
          {project.startDate ? formatDate(project.startDate) : "No start date"} →{" "}
          {project.deliveryDate ? formatDate(project.deliveryDate) : "No delivery date"}
        </p>
      ) : null}
    </div>
  );
}
