import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { projectFinanceLists } from "@/services/commercial";
import { getProjectById } from "@/services/projects";
import { submitCloseoutChecklistFormAction } from "@/app/actions/projects";

export default function ProjectCloseoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading closeout" />}>
      <ProjectCloseout params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectCloseout({
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

  const [user, project, finance] = await Promise.all([
    getCurrentUser(),
    getProjectById(id),
    projectFinanceLists(id).catch(() => ({ invoices: [], purchaseOrders: [] })),
  ]);

  if (!project) notFound();

  const invoices = finance.invoices ?? [];
  const purchaseOrders = finance.purchaseOrders ?? [];

  const notice = typeof resolvedSearchParams.notice === "string" ? resolvedSearchParams.notice : undefined;
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : undefined;

  const lead = project.projectLeadId as unknown as { _id?: unknown; name?: string; title?: string } | null;
  const isLeadOrOwner = user.role === "owner" || (lead?._id ? lead._id.toString() === user.id : false);

  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");
  const unbilledPOs = purchaseOrders.filter((po) => po.status !== "fully_billed");
  const closeout = project.closeoutChecklist;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Stage 11: Financial & Project Closeout Audit</h2>
            <p className="hint" style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>
              Formal gating between &ldquo;Delivered&rdquo; (on-site completion) and &ldquo;Closed&rdquo; (all balances,
              photo archives, and post-mortems settled).
            </p>
          </div>
          <span className={project.status === "closed" ? "badge badge-done" : "badge badge-in_review"}>
            {project.status === "closed" ? "Closed & Archived" : "Closeout Gate Pending"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            margin: "0.75rem 0 1rem",
            padding: "0.75rem",
            background: "var(--surface)",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            fontSize: "0.85rem",
          }}
        >
          <div>
            <strong>Client Receivables Status:</strong>
            {unpaidInvoices.length > 0 ? (
              <p style={{ margin: "0.25rem 0", color: "var(--warning)" }}>
                ⚠ {unpaidInvoices.length} outstanding invoice(s) totaling{" "}
                {formatCurrency(
                  unpaidInvoices.reduce((acc, i) => acc + i.amount, 0),
                  project.currency,
                )}
              </p>
            ) : (
              <p style={{ margin: "0.25rem 0", color: "var(--good)" }}>
                ✓ All client invoices paid in full ({invoices.length} total)
              </p>
            )}
          </div>

          <div>
            <strong>Supplier Commitments Status:</strong>
            {unbilledPOs.length > 0 ? (
              <p style={{ margin: "0.25rem 0", color: "var(--warning)" }}>
                ⚠ {unbilledPOs.length} open PO(s) awaiting final supplier billing
              </p>
            ) : (
              <p style={{ margin: "0.25rem 0", color: "var(--good)" }}>
                ✓ All purchase orders billed and reconciled ({purchaseOrders.length} total)
              </p>
            )}
          </div>
        </div>

        {isLeadOrOwner ? (
          <form action={submitCloseoutChecklistFormAction} className="stack" style={{ gap: "1rem" }}>
            <input type="hidden" name="projectId" value={id} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="clientWalkthroughSigned"
                  defaultChecked={closeout?.clientWalkthroughSigned ?? false}
                />
                <span>Client formal walkthrough & final acceptance signed</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                <input type="checkbox" name="punchListCleared" defaultChecked={closeout?.punchListCleared ?? false} />
                <span>Post-event punch list & defects resolved</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="postMortemCompleted"
                  defaultChecked={closeout?.postMortemCompleted ?? false}
                />
                <span>Internal post-mortem meeting conducted</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                <input type="checkbox" name="archiveDelivered" defaultChecked={closeout?.archiveDelivered ?? false} />
                <span>Final photo, video & asset archive delivered</span>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="archivedAssetsUrl"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}
                >
                  Archived Assets URL (Drive / Dropbox / Figma)
                </label>
                <input
                  id="archivedAssetsUrl"
                  name="archivedAssetsUrl"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  defaultValue={closeout?.archivedAssetsUrl ?? ""}
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label
                  htmlFor="lessonsLearned"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}
                >
                  Post-Mortem Lessons & Studio Insights
                </label>
                <input
                  id="lessonsLearned"
                  name="lessonsLearned"
                  type="text"
                  placeholder="e.g. Fabrication took 2 extra days; budget extra buffer next time"
                  defaultValue={closeout?.lessonsLearned ?? ""}
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <SubmitButton className="btn btn-primary">
                {project.status === "closed" ? "Update Closeout Audit" : "Certify Closeout & Close Project"}
              </SubmitButton>
            </div>
          </form>
        ) : (
          <div className="hint" style={{ fontSize: "0.85rem" }}>
            Only the Project Lead or Studio Owner can complete and certify the final closeout audit.
          </div>
        )}
      </div>
    </div>
  );
}