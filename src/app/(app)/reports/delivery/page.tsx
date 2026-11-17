import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { loadStudioReports } from "@/components/reports/load";

export default function ReportsDeliveryPage() {
  return (
    <Suspense fallback={<PageFallback label="Loading delivery report" />}>
      <ReportsDelivery />
    </Suspense>
  );
}

async function ReportsDelivery() {
  const { analytics, offlineMessage } = await loadStudioReports();
  if (!analytics) {
    return <p className="lede">{offlineMessage}</p>;
  }

  const { laneStats, deliveryPerformance = { onTime: 0, late: 0, unscheduled: 0 } } = analytics;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ marginTop: 0 }}>Delivery performance</h2>
        <p className="hint" style={{ marginBottom: 0 }}>
          On time {deliveryPerformance.onTime} · Late {deliveryPerformance.late} · No delivery date{" "}
          {deliveryPerformance.unscheduled}
        </p>
      </div>

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
                  <span className="hint" style={{ fontSize: "0.75rem" }}>
                    Active / In Flight
                  </span>
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
                  <span className="hint" style={{ fontSize: "0.75rem" }}>
                    Urgent Priority
                  </span>
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
                  <span className="hint" style={{ fontSize: "0.75rem" }}>
                    Blocked
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}