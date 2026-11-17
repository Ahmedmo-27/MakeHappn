import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { formatCurrency } from "@/lib/format";
import { loadStudioReports } from "@/components/reports/load";

export default function ReportsPage() {
  return (
    <Suspense fallback={<PageFallback label="Loading executive reports" />}>
      <ReportsSummary />
    </Suspense>
  );
}

async function ReportsSummary() {
  const { analytics, offlineMessage } = await loadStudioReports();
  if (!analytics) {
    return <p className="lede">{offlineMessage}</p>;
  }

  const {
    productStats,
    funnel,
    totalProjectsCount,
    totalClientsCount,
    laneStats,
    revenueByCurrency = [],
    salesByPeriod = [],
    deliveryPerformance = { onTime: 0, late: 0, unscheduled: 0 },
  } = analytics;

  const totalProductRevenue = productStats.reduce((acc, p) => acc + p.totalRevenue, 0);

  return (
    <>
      <div className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>Currency, period, and delivery</h2>
        <p>
          {revenueByCurrency
            .map((row: { currency: string; total: number }) => `${row.currency} ${Math.round(row.total).toLocaleString()}`)
            .join(" · ") || "No contracted value yet"}
        </p>
        <p className="hint">
          {salesByPeriod
            .map((row: { period: string; currency: string; amount: number }) =>
              `${row.period} ${row.currency} ${Math.round(row.amount).toLocaleString()}`,
            )
            .join(" · ") || "No period sales yet"}
        </p>
        <p className="hint">
          On time {deliveryPerformance.onTime} · Late {deliveryPerformance.late} · No delivery date{" "}
          {deliveryPerformance.unscheduled}
        </p>
      </div>

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
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>{funnel.winRatePercent}%</div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            {funnel.wonLeads} won · {funnel.inPipelineLeads} in pipeline
          </span>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Client Accounts
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>{totalClientsCount}</div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Active studio relationships
          </span>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <span className="hint" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            Delivery Lanes Staffed
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>{laneStats.length}</div>
          <span className="hint" style={{ fontSize: "0.75rem" }}>
            Vision, Delivery, Communication
          </span>
        </div>
      </div>
    </>
  );
}