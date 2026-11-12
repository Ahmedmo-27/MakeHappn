import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Sticker } from "@/components/brand/sticker";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { listDeliverables } from "@/services/deliverables";
import {
  createDeliverableFormAction,
  submitReviewFormAction,
  submitNewVersionFormAction,
} from "@/app/actions/deliverables";
import {
  STAGE_LABELS,
  PROJECT_STAGES,
  type ProjectStage,
} from "@/lib/domain";
import {
  DELIVERABLE_STATUS_LABELS,
  type DeliverableStatus,
} from "@/models/Deliverable";

export default function ProjectDeliverablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading deliverables" />}>
      <ProjectDeliverables params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectDeliverables({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const [user, project, deliverables, sParams] = await Promise.all([
    getCurrentUser(),
    getProjectById(id),
    listDeliverables(id),
    searchParams,
  ]);

  if (!project) notFound();

  const notice = typeof sParams.notice === "string" ? sParams.notice : undefined;
  const error = typeof sParams.error === "string" ? sParams.error : undefined;

  const lead = project.projectLeadId as unknown as { _id?: unknown; name?: string } | null;
  const isLeadOrOwner = user.role === "owner" || (lead?._id ? lead._id.toString() === user.id : false);

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Deliverables & Review Cycles</h2>
          <p className="hint" style={{ margin: "0.25rem 0" }}>
            Track design iterations, client feedback rounds, and approval gates. Deliverables exceeding {project.contractedRevisionRounds ?? 2} revision rounds automatically prompt a commercial Change Request.
          </p>
        </div>
      </div>

      {/* Deliverables List */}
      {deliverables.length === 0 ? (
        <div className="empty empty-illu">
          <Sticker name="carrier" className="sticker-plate empty-sticker" />
          <div>
            <p>No deliverables recorded for this project yet.</p>
            <p className="hint">Create a deliverable for the current stage (e.g. Creative Concept Deck, Spatial 3D Renderings, Brand Guidelines).</p>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: "1rem" }}>
          {deliverables.map((deliv) => {
            const stageInfo = STAGE_LABELS[deliv.stage as ProjectStage];
            const isApproved = deliv.status === "approved" || deliv.status === "final";
            const isRevReq = deliv.status === "revision_required";
            const maxRevs = project.contractedRevisionRounds ?? 2;
            const revExceeded = deliv.revisionRound > maxRevs;

            return (
              <div
                key={deliv._id.toString()}
                className="card"
                style={{
                  borderLeft: `4px solid ${isApproved ? "var(--good)" : isRevReq ? "var(--danger)" : "var(--accent)"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>
                      Stage {stageInfo?.number ?? "00"}: {stageInfo?.short ?? deliv.stage}
                    </span>
                    <h3 style={{ margin: "0.25rem 0 0.5rem", fontSize: "1.15rem" }}>{deliv.title}</h3>
                    {deliv.description ? <p className="muted" style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>{deliv.description}</p> : null}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="badge">Version {deliv.currentVersion}</span>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background: isApproved ? "var(--good-soft)" : isRevReq ? "var(--danger-soft)" : "var(--info-soft)",
                        color: isApproved ? "var(--good)" : isRevReq ? "var(--danger)" : "var(--info)",
                      }}
                    >
                      {DELIVERABLE_STATUS_LABELS[deliv.status as DeliverableStatus]}
                    </span>
                  </div>
                </div>

                {/* Revision Limit Alert */}
                {revExceeded ? (
                  <div
                    style={{
                      background: "var(--danger-soft)",
                      border: "1px solid rgba(255, 107, 87, 0.3)",
                      color: "var(--danger)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      margin: "0.5rem 0",
                      fontSize: "0.85rem",
                    }}
                  >
                    ⚠️ <strong>Scope Alert:</strong> Contracted revision limit of {maxRevs} rounds exceeded (currently at round {deliv.revisionRound}). A commercial Change Request is active for this deliverable.
                  </div>
                ) : deliv.revisionRound > 0 ? (
                  <p className="hint" style={{ margin: "0.25rem 0 0.75rem" }}>
                    Revision round {deliv.revisionRound} of {maxRevs} contracted rounds.
                  </p>
                ) : null}

                {/* Versions Accordion */}
                <div style={{ background: "var(--bg-subtle, var(--surface-2))", padding: "0.75rem", borderRadius: "6px", margin: "0.5rem 0" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)" }}>Version & Submission History:</span>
                  <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
                    {deliv.versions.map((ver, idx) => {
                      const submitter = ver.submittedById as unknown as { name?: string } | null;
                      return (
                        <li key={idx}>
                          <strong>v{ver.versionNumber}</strong> by {submitter?.name ?? "Team member"} on {formatDate(ver.submittedAt)}
                          {ver.notes ? ` — "${ver.notes}"` : ""}
                          {ver.assetUrl ? (
                            <span style={{ marginLeft: "0.5rem" }}>
                              [<a href={ver.assetUrl} target="_blank" rel="noopener noreferrer">View Asset</a>]
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Review Feedback History */}
                {deliv.reviews && deliv.reviews.length > 0 ? (
                  <div style={{ background: "var(--bg-subtle, var(--surface-2))", padding: "0.75rem", borderRadius: "6px", margin: "0.5rem 0" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)" }}>Review Log:</span>
                    <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
                      {deliv.reviews.map((rev, idx) => {
                        const revUser = rev.reviewerId as unknown as { name?: string } | null;
                        return (
                          <li key={idx}>
                            <strong>v{rev.versionNumber}</strong>: {rev.decision === "approved" ? "✓ Approved" : "✗ Revision Required"} by {revUser?.name ?? "Reviewer"} ({rev.reviewerRole}) on {formatDate(rev.reviewedAt)}
                            {rev.feedback ? ` — Feedback: "${rev.feedback}"` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                {/* Review / Resubmit Actions */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem", borderTop: "1px solid var(--border-subtle, var(--line))", paddingTop: "0.75rem" }}>
                  {isLeadOrOwner && deliv.status !== "approved" && deliv.status !== "final" ? (
                    <details className="disclosure" style={{ flex: 1 }}>
                      <summary className="btn btn-ghost" style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                        + Add Review Decision
                      </summary>
                      <form action={submitReviewFormAction} className="stack" style={{ marginTop: "0.75rem", gap: "0.75rem", padding: "1rem", background: "var(--surface-2)", borderRadius: "12px", border: "1px solid var(--line)" }}>
                        <input type="hidden" name="projectId" value={id} />
                        <input type="hidden" name="deliverableId" value={deliv._id.toString()} />
                        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                          <div className="form-group">
                            <label>Decision</label>
                            <select name="decision" required className="select">
                              <option value="approved">Approve Deliverable</option>
                              <option value="revision_required">Request Revisions</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Reviewer Perspective</label>
                            <select name="reviewerRole" defaultValue="project_lead" className="select">
                              <option value="project_lead">Project Lead</option>
                              <option value="craft_lead">Craft Lead (Design/Creative)</option>
                              <option value="executive">Executive / Founder</option>
                              <option value="client">Client Feedback</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Feedback Notes</label>
                          <input name="feedback" type="text" placeholder="Review feedback notes..." className="input" />
                        </div>
                        <div className="form-actions">
                          <SubmitButton variant="ghost">Submit Decision</SubmitButton>
                        </div>
                      </form>
                    </details>
                  ) : null}

                  {deliv.status === "revision_required" ? (
                    <details className="disclosure" style={{ flex: 1 }}>
                      <summary className="btn btn-ghost" style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--good)" }}>
                        + Submit Next Version (v{deliv.currentVersion + 1})
                      </summary>
                      <form action={submitNewVersionFormAction} className="stack" style={{ marginTop: "0.75rem", gap: "0.75rem", padding: "1rem", background: "var(--surface-2)", borderRadius: "12px", border: "1px solid var(--line)" }}>
                        <input type="hidden" name="projectId" value={id} />
                        <input type="hidden" name="deliverableId" value={deliv._id.toString()} />
                        <div className="form-group">
                          <label>Asset URL</label>
                          <input name="assetUrl" type="url" placeholder="New asset URL (Figma, Drive, PDF)..." className="input" />
                        </div>
                        <div className="form-group">
                          <label>Summary of Changes</label>
                          <input name="notes" type="text" placeholder="Summary of changes in this version..." className="input" />
                        </div>
                        <div className="form-actions">
                          <SubmitButton>Upload v{deliv.currentVersion + 1} for Review</SubmitButton>
                        </div>
                      </form>
                    </details>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Deliverable Form */}
      <div className="card form-card stack" style={{ maxWidth: "680px", marginTop: "1rem", gap: "1.25rem" }}>
        <div className="form-header">
          <h3 className="form-title">Create New Deliverable</h3>
          <p className="form-subtitle">Create an accountable output for client or craft lead sign-off.</p>
        </div>

        <form action={createDeliverableFormAction} className="stack" style={{ gap: "1.15rem" }}>
          <input type="hidden" name="projectId" value={id} />

          <div className="form-group">
            <label htmlFor="deliv-stage">Pipeline Stage *</label>
            <select id="deliv-stage" name="stage" defaultValue={project.stage} className="select">
              {PROJECT_STAGES.map((st) => (
                <option key={st} value={st}>
                  Stage {STAGE_LABELS[st].number}: {STAGE_LABELS[st].title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="deliv-title">Deliverable Title *</label>
            <input
              id="deliv-title"
              name="title"
              type="text"
              required
              placeholder="e.g. Master Spatial Floorplan & 3D Renders"
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deliv-desc">Description</label>
            <input
              id="deliv-desc"
              name="description"
              type="text"
              placeholder="Technical specs, drawing numbers, or scope summary"
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deliv-url">Asset Link (Figma, PDF, Drive)</label>
            <input
              id="deliv-url"
              name="assetUrl"
              type="url"
              placeholder="https://..."
              className="input"
            />
          </div>

          <div className="form-actions">
            <SubmitButton>Create Deliverable</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
