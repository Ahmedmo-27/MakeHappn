import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { listCollectiveMembers } from "@/services/collective";
import { getProjectCommercials } from "@/services/commercial";
import {
  createPOFormAction,
  recordBillFormAction,
  createInvoiceFormAction,
  markInvoicePaidFormAction,
} from "@/app/actions/commercial";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/models/Invoice";

export default function ProjectCommercialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading commercials & cost sheets" />}>
      <ProjectCommercials params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectCommercials({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const [user, project, sParams] = await Promise.all([
    getCurrentUser(),
    getProjectById(id),
    searchParams,
  ]);

  if (!project) notFound();

  // Role check: Only Owner/Executive or designated Project Lead can view commercials
  const lead = project.projectLeadId as unknown as { _id?: unknown } | null;
  const isLead = lead?._id ? lead._id.toString() === user.id : false;
  const canAccess = user.role === "owner" || user.isExecutive || isLead;
  if (!canAccess) {
    redirect(`/projects/${id}`);
  }

  const [commercials, collective] = await Promise.all([
    getProjectCommercials(id),
    listCollectiveMembers(),
  ]);

  const notice = typeof sParams.notice === "string" ? sParams.notice : undefined;
  const error = typeof sParams.error === "string" ? sParams.error : undefined;

  const { financialSummary, purchaseOrders, supplierBills, invoices } = commercials;
  const curr = financialSummary.currency;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Tri-Partite Financial Engine & Cost Control</h2>
        <p className="hint" style={{ margin: "0.25rem 0" }}>
          Mandatory 3-tier financial model separating Estimated Budget, Committed POs, and Actual Incurred Expenses.
        </p>
      </div>

      {/* Tri-Partite Financial KPI Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>1. APPROVED CONTRACT VALUE</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--accent)" }}>
            {curr} {financialSummary.contractValue.toLocaleString()}
          </div>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Quoted: {curr} {(project.quotedValue || 0).toLocaleString()}
          </span>
        </div>

        <div className="card" style={{ background: "var(--surface-2)" }}>
          <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>2. COMMITTED PO LIABILITIES</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--warn)" }}>
            {curr} {financialSummary.openCommittedPOCosts.toLocaleString()}
          </div>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Active open PO balances
          </span>
        </div>

        <div className="card" style={{ background: "var(--surface-2)" }}>
          <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>3. ACTUAL INCURRED COSTS</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--danger)" }}>
            {curr} {financialSummary.actualIncurredCosts.toLocaleString()}
          </div>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Invoiced supplier bills
          </span>
        </div>

        <div className="card" style={{ background: "var(--good-soft)", border: "1px solid rgba(123, 227, 165, 0.3)" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--good)" }}>PROJECTED GROSS MARGIN</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--good)" }}>
            {curr} {financialSummary.projectedGrossMargin.toLocaleString()}
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--good)" }}>
            {financialSummary.projectedMarginPercent.toFixed(1)}% Realized Margin
          </span>
        </div>
      </div>

      {/* Section 1: Purchase Orders to Collective Partners */}
      <div className="card stack" style={{ gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Committed Purchase Orders (POs)</h3>
            <p className="hint" style={{ margin: 0 }}>
              Contracts issued to artisans, fabricators, and specialized suppliers from The Collective.
            </p>
          </div>

          <details className="disclosure">
            <summary className="btn btn-primary" style={{ cursor: "pointer" }}>
              + Issue Purchase Order
            </summary>
            <div className="card form-card stack" style={{ marginTop: "1rem", maxWidth: "600px", gap: "1.15rem" }}>
              <div className="form-header">
                <h4 className="form-title">New Purchase Order</h4>
                <p className="form-subtitle">Issue a committed agreement to a collective maker or contractor.</p>
              </div>
              <form action={createPOFormAction} className="stack" style={{ gap: "1rem" }}>
                <input type="hidden" name="projectId" value={id} />

                <div className="form-group">
                  <label>Collective Partner / Maker *</label>
                  <select name="collectiveMemberId" required className="select">
                    {collective.map((m) => (
                      <option key={m._id.toString()} value={m._id.toString()}>
                        {m.name} ({m.type} · {m.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Scope / Work Description *</label>
                  <input
                    name="scopeDescription"
                    type="text"
                    required
                    placeholder="e.g. Kinetic ceiling canopy timber fabrication"
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label>Agreed PO Amount ({curr}) *</label>
                  <input name="amount" type="number" step="any" required placeholder="15000" className="input" />
                </div>

                <div className="form-actions">
                  <SubmitButton>Issue Purchase Order</SubmitButton>
                </div>
              </form>
            </div>
          </details>
        </div>

        {purchaseOrders.length === 0 ? (
          <p className="muted" style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>No purchase orders issued yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.5rem" }}>PO Number</th>
                  <th style={{ padding: "0.5rem" }}>Partner / Maker</th>
                  <th style={{ padding: "0.5rem" }}>Scope</th>
                  <th style={{ padding: "0.5rem" }}>Committed</th>
                  <th style={{ padding: "0.5rem" }}>Billed</th>
                  <th style={{ padding: "0.5rem" }}>Remaining Balance</th>
                  <th style={{ padding: "0.5rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => {
                  const partner = po.collectiveMemberId as unknown as { name?: string; type?: string } | null;
                  const remaining = Math.max(0, po.amount - (po.billedAmount || 0));

                  return (
                    <tr key={po._id.toString()} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "0.5rem", fontWeight: 700, color: "var(--accent)" }}>{po.poNumber}</td>
                      <td style={{ padding: "0.5rem" }}><strong>{partner?.name ?? "Partner"}</strong></td>
                      <td style={{ padding: "0.5rem" }}>{po.scopeDescription}</td>
                      <td style={{ padding: "0.5rem", fontWeight: 600 }}>{curr} {po.amount.toLocaleString()}</td>
                      <td style={{ padding: "0.5rem" }}>{curr} {(po.billedAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: "0.5rem", color: remaining > 0 ? "var(--warn)" : "var(--muted)", fontWeight: 600 }}>
                        {curr} {remaining.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <span className="badge">{po.status.replace("_", " ").toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Supplier Invoices (Actual Costs) */}
      <div className="card stack" style={{ gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Supplier Bills (Incurred Actuals)</h3>
            <p className="hint" style={{ margin: 0 }}>
              Incoming invoices billed against active Purchase Orders. Automatically decrements PO liability.
            </p>
          </div>

          {purchaseOrders.length > 0 ? (
            <details className="disclosure">
              <summary className="btn btn-ghost" style={{ cursor: "pointer" }}>
                + Record Supplier Bill
              </summary>
              <div className="card form-card stack" style={{ marginTop: "1rem", maxWidth: "600px", gap: "1.15rem" }}>
                <div className="form-header">
                  <h4 className="form-title">Record Supplier Invoice</h4>
                  <p className="form-subtitle">Record an incoming invoice against an approved Purchase Order.</p>
                </div>
                <form action={recordBillFormAction} className="stack" style={{ gap: "1rem" }}>
                  <input type="hidden" name="projectId" value={id} />

                  <div className="form-group">
                    <label>Link to Purchase Order *</label>
                    <select name="purchaseOrderId" required className="select">
                      {purchaseOrders.map((po) => (
                        <option key={po._id.toString()} value={po._id.toString()}>
                          {po.poNumber} — {po.scopeDescription} (Unbilled: {curr} {Math.max(0, po.amount - (po.billedAmount || 0)).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Bill / Invoice Number *</label>
                      <input name="billNumber" type="text" required placeholder="INV-2026-901" className="input" />
                    </div>
                    <div className="form-group">
                      <label>Amount ({curr}) *</label>
                      <input name="amount" type="number" step="any" required placeholder="5000" className="input" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <input name="notes" type="text" placeholder="First fabrication milestone invoice" className="input" />
                  </div>

                  <div className="form-actions">
                    <SubmitButton>Record Supplier Bill</SubmitButton>
                  </div>
                </form>
              </div>
            </details>
          ) : null}
        </div>

        {supplierBills.length === 0 ? (
          <p className="muted" style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>No supplier bills recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "0.5rem" }}>Bill #</th>
                  <th style={{ padding: "0.5rem" }}>PO Ref</th>
                  <th style={{ padding: "0.5rem" }}>Received Date</th>
                  <th style={{ padding: "0.5rem" }}>Amount</th>
                  <th style={{ padding: "0.5rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {supplierBills.map((b) => {
                  const po = b.purchaseOrderId as unknown as { poNumber?: string } | null;
                  return (
                    <tr key={b._id.toString()} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "0.5rem", fontWeight: 600 }}>{b.billNumber}</td>
                      <td style={{ padding: "0.5rem", color: "var(--accent)" }}>{po?.poNumber ?? "PO"}</td>
                      <td style={{ padding: "0.5rem" }}>{formatDate(b.receivedAt)}</td>
                      <td style={{ padding: "0.5rem", fontWeight: 700, color: "var(--danger)" }}>
                        {curr} {b.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <span style={{ color: "var(--good)", fontWeight: 600 }}>✓ {b.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Client Milestone Invoices */}
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
                    <input name="milestoneTitle" type="text" required placeholder="50% Deposit upon Confirmation" className="input" />
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
          <p className="muted" style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>No client milestone invoices issued yet.</p>
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
                    <td style={{ padding: "0.5rem", fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: "0.5rem" }}>{inv.milestoneTitle}</td>
                    <td style={{ padding: "0.5rem" }}>{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 700, color: "var(--accent)" }}>
                      {curr} {inv.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <span className={`status status-${inv.status === "paid" ? "done" : inv.status === "overdue" ? "blocked" : "in_progress"}`}>
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
    </div>
  );
}
