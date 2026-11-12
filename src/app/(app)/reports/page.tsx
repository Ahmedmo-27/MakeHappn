import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getStudioAnalytics } from "@/services/analytics";

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="page stack" style={{ gap: "2rem" }}>
          <header className="page-header">
            <div>
              <p className="eyebrow">Studio Analytics & Performance</p>
              <h1 className="page-title">Executive Reports</h1>
            </div>
            <p className="lead">
              Cross-cutting visibility into revenue mix, cost variances, sales conversion, and 3-lane studio delivery capacity.
            </p>
          </header>
          <PageFallback label="Loading executive reports" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}

async function ReportsContent() {
  await connection();
  const [, analytics] = await Promise.all([
    getCurrentUser(),
    getStudioAnalytics(),
  ]);

  const {
    productStats,
    topClients,
    varianceProjects,
    laneStats,
    funnel,
    totalProjectsCount,
    totalClientsCount,
  } = analytics;

  const totalProductRevenue = productStats.reduce((acc, p) => acc + p.totalRevenue, 0);

  return (
    <div className="page stack" style={{ gap: "2rem" }}>
      <header className="page-header">
        <div>
          <p className="eyebrow">Studio Analytics & Performance</p>
          <h1 className="page-title">Executive Reports</h1>
        </div>
        <p className="lead">
          Cross-cutting visibility into revenue mix, cost variances, sales conversion, and 3-lane studio delivery capacity.
        </p>
      </header>

      {/* Top Level Metric Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ padding: "1.25rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Total Studio Revenue
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent)", marginTop: "0.25rem" }}>
            {formatCurrency(totalProductRevenue, "USD")}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Across {totalProjectsCount} projects
          </span>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Sales Win Rate
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>
            {funnel.winRatePercent}%
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            {funnel.wonLeads} won · {funnel.inPipelineLeads} in pipeline
          </span>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Client Accounts
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>
            {totalClientsCount}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Active studio relationships
          </span>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Delivery Lanes Staffed
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>
            {laneStats.length}
          </div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Vision, Delivery, Communication
          </span>
        </div>
      </div>

      {/* Grid: Revenue by Product & Lane Capacity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem" }}>
        {/* Product Revenue Mix */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>Revenue by Studio Product</h2>
          <p className="hint" style={{ margin: "0 0 1.25rem", fontSize: "0.85rem" }}>
            Breakdown across MakeHappen&apos;s 6 core service offerings.
          </p>

          <div className="stack" style={{ gap: "1rem" }}>
            {productStats.map((prod) => {
              const percent = totalProductRevenue > 0
                ? Math.round((prod.totalRevenue / totalProductRevenue) * 100)
                : 0;

              return (
                <div key={prod.label} style={{ fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <strong>{prod.label}</strong>
                    <span>
                      {formatCurrency(prod.totalRevenue, "USD")}{" "}
                      <span className="hint">({percent}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      width: "100%",
                      backgroundColor: "var(--border)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percent}%`,
                        backgroundColor: "var(--accent)",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                    <span>{prod.projectCount} project(s)</span>
                    <span>Avg deal: {formatCurrency(prod.avgDealSize, "USD")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3-Lane Matrix Capacity */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>3-Lane Delivery Workload & Capacity</h2>
          <p className="hint" style={{ margin: "0 0 1.25rem", fontSize: "0.85rem" }}>
            Operational throughput across functional studio lanes.
          </p>

          <div className="stack" style={{ gap: "1.25rem" }}>
            {laneStats.map((lane) => (
              <div
                key={lane.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "1rem",
                  backgroundColor: "var(--surface)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "1rem" }}>{lane.name}</strong>
                  <span className="badge">{lane.totalTasks} Total Tasks</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                    textAlign: "center",
                    marginTop: "0.75rem",
                  }}
                >
                  <div style={{ padding: "0.5rem", background: "var(--bg-subtle, var(--surface-2))", borderRadius: "4px" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{lane.openTasks}</div>
                    <span className="hint" style={{ fontSize: "0.75rem" }}>Active / In Flight</span>
                  </div>

                  <div style={{ padding: "0.5rem", background: "var(--bg-subtle, var(--surface-2))", borderRadius: "4px" }}>
                    <div
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: lane.urgentTasks > 0 ? "var(--warning)" : "inherit",
                      }}
                    >
                      {lane.urgentTasks}
                    </div>
                    <span className="hint" style={{ fontSize: "0.75rem" }}>Urgent Priority</span>
                  </div>

                  <div style={{ padding: "0.5rem", background: "var(--bg-subtle, var(--surface-2))", borderRadius: "4px" }}>
                    <div
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: lane.blockedTasks > 0 ? "var(--danger)" : "inherit",
                      }}
                    >
                      {lane.blockedTasks}
                    </div>
                    <span className="hint" style={{ fontSize: "0.75rem" }}>Blocked</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estimate vs Actual Cost Variance & Margin Health */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>
          Project Profitability & Cost Variance (Estimate vs. Actual)
        </h2>
        <p className="hint" style={{ margin: "0 0 1.25rem", fontSize: "0.85rem" }}>
          Realized profit margins and variance between estimated budget and actual incurred supplier / production costs.
        </p>

        {varianceProjects.length === 0 ? (
          <p className="hint">No commercial cost data recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.5rem" }}>Project</th>
                  <th style={{ padding: "0.5rem" }}>Contract Value</th>
                  <th style={{ padding: "0.5rem" }}>Estimated Cost</th>
                  <th style={{ padding: "0.5rem" }}>Actual Cost</th>
                  <th style={{ padding: "0.5rem" }}>Cost Variance</th>
                  <th style={{ padding: "0.5rem" }}>Realized Profit</th>
                  <th style={{ padding: "0.5rem" }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {varianceProjects.map((p) => {
                  const isOverBudget = p.costVariance > 0;
                  const isHealthyMargin = p.marginPercent >= 35;

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <Link href={`/projects/${p.id}`} style={{ fontWeight: 600 }}>
                          {p.code} - {p.name}
                        </Link>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {formatCurrency(p.contract, "USD")}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {formatCurrency(p.estimated, "USD")}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>
                        {formatCurrency(p.actual, "USD")}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: isOverBudget ? "var(--danger)" : "var(--good)",
                          }}
                        >
                          {isOverBudget ? "+" : ""}
                          {formatCurrency(p.costVariance, "USD")}
                        </span>
                        <div className="hint" style={{ fontSize: "0.7rem" }}>
                          {isOverBudget ? "Over budget" : "Under budget"}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>
                        {formatCurrency(p.realizedProfit, "USD")}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span
                          className={
                            isHealthyMargin
                              ? "badge badge-done"
                              : p.marginPercent < 20
                                ? "badge badge-blocked"
                                : "badge"
                          }
                        >
                          {Math.round(p.marginPercent)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Grid: Top Clients & Pipeline Funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        {/* Top Clients Lifetime Value */}
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
                        <strong>{i + 1}. {c.name}</strong>
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

        {/* Sales Pipeline Funnel Summary */}
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
              <div className="hint" style={{ fontSize: "0.75rem" }}>Total Inquiries</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {funnel.totalLeads}
              </div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
              <div className="hint" style={{ fontSize: "0.75rem" }}>Active In Pipeline</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>
                {funnel.inPipelineLeads}
              </div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
              <div className="hint" style={{ fontSize: "0.75rem" }}>Won & Confirmed</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--good)", marginTop: "0.25rem" }}>
                {funnel.wonLeads}
              </div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
              <div className="hint" style={{ fontSize: "0.75rem" }}>Win Rate Ratio</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)", marginTop: "0.25rem" }}>
                {funnel.winRatePercent}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
