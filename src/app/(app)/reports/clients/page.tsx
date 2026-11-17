import Link from "next/link";
import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { formatCurrency } from "@/lib/format";
import { loadStudioReports } from "@/components/reports/load";

export default function ReportsClientsPage() {
  return (
    <Suspense fallback={<PageFallback label="Loading client report" />}>
      <ReportsClients />
    </Suspense>
  );
}

async function ReportsClients() {
  const { analytics, offlineMessage } = await loadStudioReports();
  if (!analytics) {
    return <p className="lede">{offlineMessage}</p>;
  }

  const { topClients, funnel } = analytics;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>Client Lifetime Value Leaderboard</h2>
        <p className="hint" style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
          Top client relationships by total contracted project volume.
        </p>

        {topClients.length === 0 ? (
          <p className="hint">No client spend recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.5rem" }}>Client Brand</th>
                  <th style={{ padding: "0.5rem" }}>Projects</th>
                  <th style={{ padding: "0.5rem" }}>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => (
                  <tr key={c.name} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem" }}>
                      <strong>
                        {i + 1}. {c.name}
                      </strong>
                    </td>
                    <td style={{ padding: "0.5rem" }}>{c.projectCount}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 600, color: "var(--accent)" }}>
                      {formatCurrency(c.totalSpent, "USD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Sales Pipeline Conversion</h2>
          <Link href="/sales" className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
            View CRM →
          </Link>
        </div>
        <p className="hint" style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
          Lead generation through opportunity qualification and contract execution.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
            marginTop: "0.75rem",
          }}
        >
          <div style={{ padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
            <div className="hint" style={{ fontSize: "0.75rem" }}>
              Total Inquiries
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>{funnel.totalLeads}</div>
          </div>

          <div style={{ padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
            <div className="hint" style={{ fontSize: "0.75rem" }}>
              Active In Pipeline
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>{funnel.inPipelineLeads}</div>
          </div>

          <div style={{ padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
            <div className="hint" style={{ fontSize: "0.75rem" }}>
              Won & Confirmed
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--good)", marginTop: "0.25rem" }}>
              {funnel.wonLeads}
            </div>
          </div>

          <div style={{ padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
            <div className="hint" style={{ fontSize: "0.75rem" }}>
              Win Rate Ratio
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)", marginTop: "0.25rem" }}>
              {funnel.winRatePercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}