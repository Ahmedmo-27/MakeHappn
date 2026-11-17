import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { getProjectById } from "@/services/projects";
import { listCollectiveMembers } from "@/services/collective";
import { getProjectCommercials } from "@/services/commercial";
import { createPOFormAction } from "@/app/actions/commercial";

export default function ProjectCommercialsPosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading purchase orders" />}>
      <ProjectCommercialsPos params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectCommercialsPos({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const [project, sParams, commercials, collective] = await Promise.all([
    getProjectById(id),
    searchParams,
    getProjectCommercials(id),
    listCollectiveMembers(),
  ]);

  if (!project) notFound();

  const notice = typeof sParams.notice === "string" ? sParams.notice : undefined;
  const error = typeof sParams.error === "string" ? sParams.error : undefined;

  const { financialSummary, purchaseOrders } = commercials;
  const curr = financialSummary.currency;

  return (
    <>
      <Banner error={error} notice={notice} />

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
          <p className="muted" style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
            No purchase orders issued yet.
          </p>
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
                      <td style={{ padding: "0.5rem" }}>
                        <strong>{partner?.name ?? "Partner"}</strong>
                      </td>
                      <td style={{ padding: "0.5rem" }}>{po.scopeDescription}</td>
                      <td style={{ padding: "0.5rem", fontWeight: 600 }}>
                        {curr} {po.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        {curr} {(po.billedAmount || 0).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "0.5rem",
                          color: remaining > 0 ? "var(--warn)" : "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
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
    </>
  );
}