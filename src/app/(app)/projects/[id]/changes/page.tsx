import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { listProjectChangeRequests } from "@/services/commercial";
import {
  createChangeRequestFormAction,
  approveChangeRequestFormAction,
} from "@/app/actions/changes";
import type { CRReason, CRStatus } from "@/models/ChangeRequest";

const REASON_LABELS: Record<CRReason, string> = {
  client_scope_addition: "Client Scope Addition",
  revision_limit_exceeded: "Revision Limit Exceeded (>2 Rounds)",
  site_condition: "Site / Venue Condition",
  budget_adjustment: "Budget & Material Adjustment",
};

const STATUS_LABELS: Record<CRStatus, { label: string; badgeClass: string }> = {
  draft: { label: "Draft", badgeClass: "badge" },
  submitted: { label: "Submitted for Review", badgeClass: "badge badge-in_review" },
  client_approved: { label: "Client Approved & Applied", badgeClass: "badge badge-done" },
  client_rejected: { label: "Rejected", badgeClass: "badge badge-blocked" },
};

export default function ProjectChangesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading change requests" />}>
      <ProjectChanges params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectChanges({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const [user, project, changeRequests, sParams] = await Promise.all([
    getCurrentUser(),
    getProjectById(id),
    listProjectChangeRequests(id),
    searchParams,
  ]);

  if (!project) notFound();

  const notice = typeof sParams.notice === "string" ? sParams.notice : undefined;
  const error = typeof sParams.error === "string" ? sParams.error : undefined;

  const lead = project.projectLeadId as unknown as { _id?: unknown; name?: string } | null;
  const isLeadOrOwner = user.role === "owner" || (lead?._id ? lead._id.toString() === user.id : false);

  // Computations
  const approvedCRs = changeRequests.filter((cr) => cr.status === "client_approved");
  const pendingCRs = changeRequests.filter(
    (cr) => cr.status === "draft" || cr.status === "submitted",
  );

  const totalRevenueDelta = approvedCRs.reduce((acc, cr) => acc + (cr.clientRevenueDelta || 0), 0);
  const totalCostDelta = approvedCRs.reduce((acc, cr) => acc + (cr.internalCostDelta || 0), 0);
  const totalScheduleDelta = approvedCRs.reduce((acc, cr) => acc + (cr.timeDeltaDays || 0), 0);

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Scope & Change Request Register</h2>
        <p className="hint" style={{ margin: "0.25rem 0" }}>
          Formal audit log for scope shifts, additional revision rounds, and cost/timeline variations.
          Client approval dynamically updates the project&apos;s contracted revenue, estimated costs, and delivery milestone.
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Approved Revenue Delta
          </span>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: totalRevenueDelta >= 0 ? "var(--accent)" : "inherit",
              marginTop: "0.25rem",
            }}
          >
            {totalRevenueDelta >= 0 ? "+" : ""}
            {formatCurrency(totalRevenueDelta, project.currency)}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Added to client billing
          </span>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Approved Internal Cost Delta
          </span>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: totalCostDelta > 0 ? "var(--warning)" : "inherit",
              marginTop: "0.25rem",
            }}
          >
            {totalCostDelta >= 0 ? "+" : ""}
            {formatCurrency(totalCostDelta, project.currency)}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Added to production budget
          </span>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Schedule Extension
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>
            {totalScheduleDelta >= 0 ? `+${totalScheduleDelta} days` : `${totalScheduleDelta} days`}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Pushed delivery target
          </span>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Pending Review
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>
            {pendingCRs.length}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Awaiting client or lead signoff
          </span>
        </div>
      </div>

      {/* Change Requests Table */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Change Log History</h3>

        {changeRequests.length === 0 ? (
          <p className="hint">No change requests have been recorded for this project yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.5rem" }}>Code</th>
                  <th style={{ padding: "0.5rem" }}>Title & Reason</th>
                  <th style={{ padding: "0.5rem" }}>Client Revenue</th>
                  <th style={{ padding: "0.5rem" }}>Internal Cost</th>
                  <th style={{ padding: "0.5rem" }}>Schedule</th>
                  <th style={{ padding: "0.5rem" }}>Status</th>
                  <th style={{ padding: "0.5rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {changeRequests.map((cr) => {
                  const statusInfo = STATUS_LABELS[cr.status] ?? {
                    label: cr.status,
                    badgeClass: "badge",
                  };
                  const approver = cr.approvedById as unknown as { name?: string } | null;

                  return (
                    <tr
                      key={String(cr._id)}
                      style={{ borderBottom: "1px solid var(--border)", verticalAlign: "top" }}
                    >
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>{cr.code}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <strong>{cr.title}</strong>
                        <div className="hint" style={{ fontSize: "0.75rem" }}>
                          {REASON_LABELS[cr.reason]}
                        </div>
                        {cr.description && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              marginTop: "0.25rem",
                              color: "var(--muted)",
                            }}
                          >
                            {cr.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span style={{ fontWeight: 600 }}>
                          {cr.clientRevenueDelta >= 0 ? "+" : ""}
                          {formatCurrency(cr.clientRevenueDelta, project.currency)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span>
                          {cr.internalCostDelta >= 0 ? "+" : ""}
                          {formatCurrency(cr.internalCostDelta, project.currency)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {cr.timeDeltaDays !== 0 ? (
                          <span>+{cr.timeDeltaDays}d</span>
                        ) : (
                          <span className="hint">0d</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span className={statusInfo.badgeClass}>{statusInfo.label}</span>
                        {cr.approvedAt && approver?.name && (
                          <div className="hint" style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>
                            By {approver.name} on {formatDate(cr.approvedAt)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {cr.status !== "client_approved" && isLeadOrOwner && (
                          <form action={approveChangeRequestFormAction}>
                            <input type="hidden" name="changeRequestId" value={String(cr._id)} />
                            <input type="hidden" name="projectId" value={id} />
                            <SubmitButton className="button secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
                              Approve & Apply
                            </SubmitButton>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log New Change Request Form */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Log New Change Request</h3>
        <p className="hint" style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
          Document scope creep, extra mockups requested by client, or site-induced alterations before execution.
        </p>

        <form action={createChangeRequestFormAction} className="stack" style={{ gap: "1rem" }}>
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
                Change Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Additional 3D Spatial Flythrough"
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label htmlFor="reason" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Primary Reason *
              </label>
              <select id="reason" name="reason" className="input" style={{ width: "100%" }} defaultValue="client_scope_addition">
                <option value="client_scope_addition">Client Scope Addition</option>
                <option value="revision_limit_exceeded">Revision Limit Exceeded (&gt;2 Rounds)</option>
                <option value="site_condition">Site / Venue Condition</option>
                <option value="budget_adjustment">Budget & Material Adjustment</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label htmlFor="clientRevenueDelta" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Client Revenue Impact ({project.currency})
              </label>
              <input
                id="clientRevenueDelta"
                name="clientRevenueDelta"
                type="number"
                step="0.01"
                defaultValue="0"
                className="input"
                style={{ width: "100%" }}
              />
              <span className="hint" style={{ fontSize: "0.75rem" }}>Amount billed to client</span>
            </div>

            <div>
              <label htmlFor="internalCostDelta" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Internal Cost Impact ({project.currency})
              </label>
              <input
                id="internalCostDelta"
                name="internalCostDelta"
                type="number"
                step="0.01"
                defaultValue="0"
                className="input"
                style={{ width: "100%" }}
              />
              <span className="hint" style={{ fontSize: "0.75rem" }}>Studio / fabrication cost</span>
            </div>

            <div>
              <label htmlFor="timeDeltaDays" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Schedule Impact (Days)
              </label>
              <input
                id="timeDeltaDays"
                name="timeDeltaDays"
                type="number"
                step="1"
                defaultValue="0"
                className="input"
                style={{ width: "100%" }}
              />
              <span className="hint" style={{ fontSize: "0.75rem" }}>Milestone extension</span>
            </div>
          </div>

          <div>
            <label htmlFor="description" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Detailed Description & Justification
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Outline what changed from original agreement and rationale..."
              className="input"
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <div>
            <SubmitButton className="button primary">Log Change Request</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
