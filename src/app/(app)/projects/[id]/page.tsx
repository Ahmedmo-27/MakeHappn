import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Sticker } from "@/components/brand/sticker";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { advanceStageFormAction, updateStatusFormAction } from "@/app/actions/projects";
import {
  STAGE_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STAGES,
  type ProjectStage,
} from "@/lib/domain";

export default function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project overview" />}>
      <ProjectOverview params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectOverview({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const resolvedSearchParams = searchParams
    ? ((await searchParams) as Record<string, string | string[] | undefined>)
    : ({} as Record<string, string | string[] | undefined>);

  const [user, project] = await Promise.all([getCurrentUser(), getProjectById(id)]);

  if (!project) notFound();

  const notice = typeof resolvedSearchParams.notice === "string" ? resolvedSearchParams.notice : undefined;
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : undefined;

  const client = project.clientId as unknown as {
    name?: string;
    brandName?: string;
    paymentTermsDays?: number;
    contacts?: Array<{ name: string; email: string; isPrimary: boolean }>;
  } | null;

  const lead = project.projectLeadId as unknown as { _id?: unknown; name?: string; title?: string } | null;
  const isLeadOrOwner = user.role === "owner" || (lead?._id ? lead._id.toString() === user.id : false);

  const currentStageIndex = PROJECT_STAGES.indexOf(project.stage);
  const nextStage = currentStageIndex < PROJECT_STAGES.length - 1 ? PROJECT_STAGES[currentStageIndex + 1] : null;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      {/* Top Grid: Stage Advancement & Status Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Current Stage & Verification Gate</h2>
            <span className="badge badge-active">
              Stage {STAGE_LABELS[project.stage].number} of 11
            </span>
          </div>

          <p style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.05rem" }}>
            <strong>{STAGE_LABELS[project.stage].title}</strong>{" "}
            <span className="muted" style={{ fontSize: "0.85rem" }}>({STAGE_LABELS[project.stage].macroPhase})</span>
          </p>

          <div
            style={{
              margin: "0.75rem 0",
              padding: "0.75rem 0.9rem",
              background: "var(--bg-subtle, var(--surface-2))",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle, var(--line))",
              display: "grid",
              gap: "0.4rem",
              fontSize: "0.85rem",
            }}
          >
            <div>
              <strong style={{ color: "var(--ink)", display: "block", fontSize: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                What happens in this stage:
              </strong>
              <span className="muted">{STAGE_LABELS[project.stage].whatHappens}</span>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <strong style={{ color: "var(--good)", display: "block", fontSize: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Expected Output Required for Gate Sign-off:
              </strong>
              <span style={{ color: "var(--good)", fontWeight: 600 }}>{STAGE_LABELS[project.stage].expectedOutput}</span>
            </div>
          </div>

          {isLeadOrOwner && nextStage ? (
            <form action={advanceStageFormAction} style={{ borderTop: "1px solid var(--border-subtle, var(--line))", paddingTop: "1rem" }}>
              <input type="hidden" name="projectId" value={id} />
              <input type="hidden" name="targetStage" value={nextStage} />
              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label htmlFor="notes" style={{ fontSize: "0.85rem" }}>Verification Sign-off Notes</label>
                <input
                  id="notes"
                  name="notes"
                  type="text"
                  placeholder="e.g. Client deposit verified / Creative direction approved by Sama"
                  className="input"
                />
              </div>
              <SubmitButton>
                Advance to Stage {STAGE_LABELS[nextStage].number}: {STAGE_LABELS[nextStage].short} →
              </SubmitButton>
            </form>
          ) : !nextStage ? (
            <p className="notice">This project has reached the final stage (Financial & Project Close).</p>
          ) : (
            <p className="hint">Only the Project Lead or Studio Owner can certify and advance stage gates.</p>
          )}
        </div>

        <div className="card">
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>Project Governance</h2>
          {isLeadOrOwner ? (
            <form action={updateStatusFormAction} className="stack" style={{ gap: "0.75rem" }}>
              <input type="hidden" name="projectId" value={id} />
              <div className="form-group">
                <label htmlFor="status" style={{ fontSize: "0.85rem" }}>Project Status</label>
                <select id="status" name="status" defaultValue={project.status} className="input">
                  {PROJECT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {PROJECT_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="health" style={{ fontSize: "0.85rem" }}>Health Flag</label>
                <select id="health" name="health" defaultValue={project.health} className="input">
                  <option value="on_track">On Track</option>
                  <option value="at_risk">At Risk</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <SubmitButton variant="ghost">Update Status</SubmitButton>
            </form>
          ) : (
            <div>
              <p>Status: <strong>{PROJECT_STATUS_LABELS[project.status]}</strong></p>
              <p>Health: <strong>{project.health.replace("_", " ")}</strong></p>
            </div>
          )}

          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle, var(--line))" }}>
            <span style={{ fontSize: "0.85rem" }} className="muted">
              Delivery State:{" "}
              <strong style={{ color: project.isDelivered ? "var(--good)" : "var(--muted)" }}>
                {project.isDelivered ? "Delivered" : "In Flight"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Client & Schedule */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="card">
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>Client Organization</h2>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{client?.brandName || client?.name || "Client"}</strong>
          </p>
          <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
            Payment Terms: {client?.paymentTermsDays ?? 30} days
          </p>
          {client?.contacts && client.contacts.length > 0 ? (
            <div style={{ marginTop: "0.5rem" }}>
              <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Primary Contacts:</span>
              <ul style={{ margin: "0.25rem 0", paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
                {client.contacts.map((c, i) => (
                  <li key={i}>
                    {c.name} ({c.email}) {c.isPrimary ? "· Primary" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>Target Timeline</h2>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "0.5rem 0" }}>
            <span className="muted">Target Start:</span>
            <strong>{project.startDate ? formatDate(project.startDate) : "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "0.5rem 0" }}>
            <span className="muted">Target Delivery:</span>
            <strong>{project.deliveryDate ? formatDate(project.deliveryDate) : "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "0.5rem 0" }}>
            <span className="muted">Closeout Date:</span>
            <strong>{project.closeDate ? formatDate(project.closeDate) : "—"}</strong>
          </div>
        </div>
      </div>

      {/* 11 Stage Milestone Audit Trail */}
      <div className="card">
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>11-Stage Verification Log & Milestones</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-subtle, var(--line))" }}>
                <th style={{ padding: "0.5rem" }}>Stage</th>
                <th style={{ padding: "0.5rem" }}>Name</th>
                <th style={{ padding: "0.5rem" }}>Gate Status</th>
                <th style={{ padding: "0.5rem" }}>Approved At</th>
                <th style={{ padding: "0.5rem" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {project.milestones.map((m) => {
                const info = STAGE_LABELS[m.stage];
                const isCurrent = m.stage === project.stage;
                const isBypassed = project.bypassedStages?.includes(m.stage as ProjectStage);

                return (
                  <tr
                    key={m.stage}
                    style={{
                      borderBottom: "1px solid var(--border-subtle, var(--line))",
                      background: isCurrent ? "var(--bg-subtle)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "0.5rem", fontWeight: 600 }}>{info.number}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {info.title}
                      {isCurrent ? <span className="badge badge-active" style={{ marginLeft: "0.5rem" }}>Active</span> : null}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {isBypassed ? (
                        <span className="muted">Bypassed</span>
                      ) : m.isGateApproved ? (
                        <span style={{ color: "var(--good)", fontWeight: 600 }}>✓ Verified</span>
                      ) : isCurrent ? (
                        <span style={{ color: "var(--accent)", fontWeight: 600 }}>In Review</span>
                      ) : (
                        <span className="muted">Pending</span>
                      )}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {m.completedAt ? formatDate(m.completedAt) : "—"}
                    </td>
                    <td style={{ padding: "0.5rem", color: "var(--muted)" }}>
                      {m.approvalNotes || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="project-stamp">
        <Sticker name="barcode" className="project-stamp-mark" />
      </footer>
    </div>
  );
}
