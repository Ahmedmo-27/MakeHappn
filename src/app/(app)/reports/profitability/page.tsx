import Link from "next/link";
import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { formatCurrency } from "@/lib/format";
import { loadStudioReports } from "@/components/reports/load";

export default function ReportsProfitabilityPage() {
  return (
    <Suspense fallback={<PageFallback label="Loading profitability report" />}>
      <ReportsProfitability />
    </Suspense>
  );
}

async function ReportsProfitability() {
  const { analytics, offlineMessage } = await loadStudioReports();
  if (!analytics) {
    return <p className="lede">{offlineMessage}</p>;
  }

  const { varianceProjects } = analytics;

  return (
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
                    <td style={{ padding: "0.75rem 0.5rem" }}>{formatCurrency(p.contract, "USD")}</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>{formatCurrency(p.estimated, "USD")}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>{formatCurrency(p.actual, "USD")}</td>
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
                          isHealthyMargin ? "badge badge-done" : p.marginPercent < 20 ? "badge badge-blocked" : "badge"
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
  );
}