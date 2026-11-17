import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { formatCurrency } from "@/lib/format";
import { loadStudioReports } from "@/components/reports/load";

export default function ReportsRevenuePage() {
  return (
    <Suspense fallback={<PageFallback label="Loading revenue report" />}>
      <ReportsRevenue />
    </Suspense>
  );
}

async function ReportsRevenue() {
  const { analytics, offlineMessage } = await loadStudioReports();
  if (!analytics) {
    return <p className="lede">{offlineMessage}</p>;
  }

  const { productStats } = analytics;
  const totalProductRevenue = productStats.reduce((acc, p) => acc + p.totalRevenue, 0);

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>Revenue by Studio Product</h2>
      <p className="hint" style={{ margin: "0 0 1.25rem", fontSize: "0.85rem" }}>
        Breakdown across MakeHappen&apos;s 6 core service offerings.
      </p>

      <div className="stack" style={{ gap: "1rem" }}>
        {productStats.map((prod) => {
          const percent = totalProductRevenue > 0 ? Math.round((prod.totalRevenue / totalProductRevenue) * 100) : 0;

          return (
            <div key={prod.label} style={{ fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <strong>{prod.label}</strong>
                <span>
                  {formatCurrency(prod.totalRevenue, "USD")} <span className="hint">({percent}%)</span>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  marginTop: "0.25rem",
                }}
              >
                <span>{prod.projectCount} project(s)</span>
                <span>Avg deal: {formatCurrency(prod.avgDealSize, "USD")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}