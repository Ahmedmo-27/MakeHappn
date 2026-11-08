import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { listProjectRisks } from "@/services/risks";
import { User } from "@/models/User";
import {
  createRiskFormAction,
  resolveRiskFormAction,
} from "@/app/actions/risks";
import {
  RISK_CATEGORIES,
  RISK_CATEGORY_LABELS,
  RISK_SEVERITIES,
  type RiskSeverity,
} from "@/models/RiskIssue";

const SEVERITY_BADGES: Record<RiskSeverity, { label: string; badgeClass: string }> = {
  critical: { label: "Critical", badgeClass: "badge badge-blocked" },
  high: { label: "High", badgeClass: "badge badge-in_review" },
  medium: { label: "Medium", badgeClass: "badge" },
  low: { label: "Low", badgeClass: "badge badge-done" },
};

export default function ProjectRisksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading risks & issues" />}>
      <ProjectRisks params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectRisks({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await connectDB();
  const { id } = await params;
  const [currentUser, project, risks, users, sParams] = await Promise.all([
    getCurrentUser(),
    getProjectById(id),
    listProjectRisks(id),
    User.find().sort({ name: 1 }).lean(),
    searchParams,
  ]);

  if (!project) notFound();

  const notice = typeof sParams.notice === "string" ? sParams.notice : undefined;
  const error = typeof sParams.error === "string" ? sParams.error : undefined;

  const openRisks = risks.filter((r) => r.status === "open");
  const criticalOpen = openRisks.filter((r) => r.severity === "critical");
  const resolvedRisks = risks.filter((r) => r.status === "resolved");

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Risk & Issue Register</h2>
        <p className="hint" style={{ margin: "0.25rem 0" }}>
          Active governance for schedule slippage, budget overruns, fabrication errors, and site surprises.
          Logging a Critical severity risk automatically flags this project&apos;s executive health as At Risk.
        </p>
      </div>

      {criticalOpen.length > 0 && (
        <div
          style={{
            padding: "0.85rem 1rem",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid var(--danger, #dc2626)",
            borderRadius: "6px",
            fontSize: "0.875rem",
            color: "var(--danger, #dc2626)",
          }}
        >
          <strong>Executive Alert:</strong> {criticalOpen.length} critical risk(s) are actively threatening delivery or profit margins. Immediate mitigation required.
        </div>
      )}

      {/* KPI Tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Critical Severity
          </span>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: criticalOpen.length > 0 ? "var(--danger, #dc2626)" : "inherit",
              marginTop: "0.25rem",
            }}
          >
            {criticalOpen.length}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Blocks milestone delivery
          </span>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Total Open Issues
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>
            {openRisks.length}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Under active mitigation
          </span>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Resolved Items
          </span>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--accent)",
              marginTop: "0.25rem",
            }}
          >
            {resolvedRisks.length}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Mitigated & closed out
          </span>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Project Health State
          </span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.5rem" }}>
            <span
              className={
                project.health === "at_risk"
                  ? "badge badge-blocked"
                  : project.health === "blocked"
                    ? "badge badge-blocked"
                    : "badge badge-done"
              }
            >
              {project.health.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Risks Table */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Risk & Issue Log</h3>

        {risks.length === 0 ? (
          <p className="hint">No risks or operational issues have been flagged for this project.</p>
        ) : (
          <div className="stack" style={{ gap: "1rem" }}>
            {risks.map((risk) => {
              const sev = SEVERITY_BADGES[risk.severity] ?? {
                label: risk.severity,
                badgeClass: "badge",
              };
              const owner = risk.ownerId as unknown as { name?: string; title?: string } | null;

              return (
                <div
                  key={String(risk._id)}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "1rem",
                    backgroundColor:
                      risk.status === "open" && risk.severity === "critical"
                        ? "rgba(220, 38, 38, 0.03)"
                        : "transparent",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <span className={sev.badgeClass} style={{ marginRight: "0.5rem" }}>
                        {sev.label}
                      </span>
                      <span className="badge" style={{ marginRight: "0.5rem" }}>
                        {RISK_CATEGORY_LABELS[risk.category]}
                      </span>
                      <strong style={{ fontSize: "1rem" }}>{risk.title}</strong>
                    </div>
                    <span
                      className={
                        risk.status === "resolved"
                          ? "badge badge-done"
                          : risk.status === "mitigated"
                            ? "badge badge-in_review"
                            : "badge"
                      }
                    >
                      {risk.status.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                    <strong>Impact: </strong>
                    {risk.impactDescription}
                  </p>

                  {risk.mitigationDecision && (
                    <p
                      style={{
                        margin: "0.25rem 0",
                        fontSize: "0.85rem",
                        color: "var(--muted)",
                      }}
                    >
                      <strong>Mitigation Plan: </strong>
                      {risk.mitigationDecision}
                    </p>
                  )}

                  {risk.resolutionNotes && (
                    <div
                      style={{
                        margin: "0.5rem 0",
                        padding: "0.5rem",
                        backgroundColor: "var(--surface)",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <strong>Resolution Notes: </strong>
                      {risk.resolutionNotes}
                      {risk.resolvedAt && (
                        <span className="hint" style={{ marginLeft: "0.5rem" }}>
                          ({formatDate(risk.resolvedAt)})
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid var(--border)",
                      fontSize: "0.75rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <span className="hint">
                      Owner: <strong>{owner?.name ?? "Studio Team"}</strong>
                      {owner?.title ? ` (${owner.title})` : ""}
                    </span>

                    {risk.status !== "resolved" && (
                      <form
                        action={resolveRiskFormAction}
                        style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
                      >
                        <input type="hidden" name="riskId" value={String(risk._id)} />
                        <input type="hidden" name="projectId" value={id} />
                        <input
                          type="text"
                          name="resolutionNotes"
                          required
                          placeholder="Resolution action taken..."
                          className="input"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", width: "220px" }}
                        />
                        <select
                          name="status"
                          className="input"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                          defaultValue="resolved"
                        >
                          <option value="mitigated">Mark Mitigated</option>
                          <option value="resolved">Mark Resolved</option>
                        </select>
                        <SubmitButton
                          className="button secondary"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        >
                          Save
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log New Risk Form */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Flag New Project Risk / Issue</h3>
        <p className="hint" style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
          Anticipate timeline compression, fabrication delays, permit snags, or budget drifts before they materialize.
        </p>

        <form action={createRiskFormAction} className="stack" style={{ gap: "1rem" }}>
          <input type="hidden" name="projectId" value={id} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label htmlFor="title" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Risk / Issue Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Acrylic supplier delayed by 4 business days"
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label htmlFor="category" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Risk Category *
              </label>
              <select id="category" name="category" className="input" style={{ width: "100%" }} defaultValue="fabrication_supplier">
                {RISK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {RISK_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label htmlFor="severity" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Severity Level *
              </label>
              <select id="severity" name="severity" className="input" style={{ width: "100%" }} defaultValue="medium">
                {RISK_SEVERITIES.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ownerId" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Accountable Owner *
              </label>
              <select id="ownerId" name="ownerId" className="input" style={{ width: "100%" }} defaultValue={currentUser.id}>
                {users.map((u) => (
                  <option key={String(u._id)} value={String(u._id)}>
                    {u.name} {u.title ? `(${u.title})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="impactDescription" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Impact Description *
            </label>
            <textarea
              id="impactDescription"
              name="impactDescription"
              rows={2}
              required
              placeholder="What happens to the timeline, cost, or client experience if unaddressed?"
              className="input"
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <div>
            <label htmlFor="mitigationDecision" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Mitigation Plan / Contingency Decision
            </label>
            <textarea
              id="mitigationDecision"
              name="mitigationDecision"
              rows={2}
              placeholder="Alternative supplier source, expedited freight, or revised installation order..."
              className="input"
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <div>
            <SubmitButton className="button primary">Log to Risk Register</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
