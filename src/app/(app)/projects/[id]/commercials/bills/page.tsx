import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { getProjectById } from "@/services/projects";
import { getProjectCommercials } from "@/services/commercial";
import { recordBillFormAction } from "@/app/actions/commercial";

export default function ProjectCommercialsBillsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading supplier bills" />}>
      <ProjectCommercialsBills params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectCommercialsBills({
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

  const { financialSummary, purchaseOrders, supplierBills } = commercials;
  const curr = financialSummary.currency;

  return (
    <>
      <Banner error={error} notice={notice} />

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
                          {po.poNumber} — {po.scopeDescription} (Unbilled: {curr}{" "}
                          {Math.max(0, po.amount - (po.billedAmount || 0)).toLocaleString()})
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
          <p className="muted" style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
            No supplier bills recorded yet.
          </p>
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
    </>
  );
}