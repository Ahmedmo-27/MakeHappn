import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { getProjectById } from "@/services/projects";
import { getProjectCommercials } from "@/services/commercial";
import { createInvoiceFormAction, markInvoicePaidFormAction } from "@/app/actions/commercial";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/models/Invoice";

export default function ProjectCommercialsInvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading client invoices" />}>
      <ProjectCommercialsInvoices params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectCommercialsInvoices({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const [project, sParams, commercials] = await Promise.all([
    getProjectById(id),
    searchParams,
    getProjectCommercials(id),
  ]);

  if (!project) notFound();

  const notice = typeof sParams.notice === "string" ? sParams.notice : undefined;
  const error = typeof sParams.error === "string" ? sParams.error : undefined;

  const { financialSummary, invoices } = commercials;
  const curr = financialSummary.currency;

  return (
    <>
      <Banner error={error} notice={notice} />

      <div className="card stack" style={{ gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Client Milestone Invoices</h3>
            <p className="hint" style={{ margin: 0 }}>
              Milestone billing schedules and payment collections from the client.
            </p>
          </div>

          <details className="disclosure">
            <summary className="btn btn-ghost" style={{ cursor: "pointer" }}>
              + Create Client Invoice
            </summary>
            <div className="card form-card stack" style={{ marginTop: "1rem", maxWidth: "600px", gap: "1.15rem" }}>
              <div className="form-header">
                <h4 className="form-title">Issue Milestone Invoice</h4>
                <p className="form-subtitle">Generate a client milestone invoice for contracted deliverables.</p>
              </div>
              <form action={createInvoiceFormAction} className="stack" style={{ gap: "1rem" }}>
                <input type="hidden" name="projectId" value={id} />

                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Invoice Number *</label>
                    <input name="invoiceNumber" type="text" required placeholder="INV-MH-01" className="input" />
                  </div>
                  <div className="form-group">
                    <label>Milestone Title *</label>
                    <input
                      name="milestoneTitle"
                      type="text"
                      required
                      placeholder="50% Deposit upon Confirmation"
                      className="input"
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Amount ({curr}) *</label>
                    <input name="amount" type="number" step="any" required placeholder="50000" className="input" />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input name="dueDate" type="date" className="input" />
                  </div>
                </div>

                <div className="form-actions">
                  <SubmitButton>Issue Client Invoice</SubmitButton>
                </div>
              </form>
            </div>
          </details>
        </div>

        {invoices.length === 0 ? (
          <p className="muted" style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
            No client milestone invoices issued yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.5rem" }}>Invoice #</th>
                  <th style={{ padding: "0.5rem" }}>Milestone</th>
                  <th style={{ padding: "0.5rem" }}>Due Date</th>
                  <th style={{ padding: "0.5rem" }}>Amount</th>
                  <th style={{ padding: "0.5rem" }}>Status</th>
                  <th style={{ padding: "0.5rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id.toString()} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "0.5rem", fontWeight: 700 }}>
                      <Link href={`/projects/${id}/invoices/${inv._id.toString()}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td style={{ padding: "0.5rem" }}>{inv.milestoneTitle}</td>
                    <td style={{ padding: "0.5rem" }}>{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 700, color: "var(--accent)" }}>
                      {curr} {inv.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <span
                        className={`status status-${inv.status === "paid" ? "done" : inv.status === "overdue" ? "blocked" : "in_progress"}`}
                      >
                        {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {inv.status !== "paid" ? (
                        <form action={markInvoicePaidFormAction}>
                          <input type="hidden" name="projectId" value={id} />
                          <input type="hidden" name="invoiceId" value={inv._id.toString()} />
                          <SubmitButton variant="ghost">Mark Paid ✓</SubmitButton>
                        </form>
                      ) : (
                        <span style={{ color: "var(--good)", fontSize: "0.8rem", fontWeight: 600 }}>Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}