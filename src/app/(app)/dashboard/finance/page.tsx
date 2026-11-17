import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { loadDashboardBundle, money, pct } from "@/components/dashboard/shared";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export default function DashboardFinancePage() {
  return (
    <Suspense fallback={<PageFallback label="Loading finance view" />}>
      <FinanceView />
    </Suspense>
  );
}

async function FinanceView() {
  await connection();
  const user = await getCurrentUser();
  const isExec = user.role === "owner" || !!user.isExecutive;
  if (!isExec) redirect("/dashboard");

  const {
    contractedLabel,
    committedLabel,
    totalContractedValue,
    totalActualCost,
    totalProjectedMargin,
    totalInvoiced,
    totalCollected,
    overdueInvoices,
  } = await loadDashboardBundle(user);

  return (
    <div className="stack" style={{ gap: "1.6rem" }}>
      <section>
        <div className="section-head">
          <div>
            <span className="section-index">Money</span>
            <h2>From contract to cash</h2>
            <p>Estimated, committed and actual costs stay separate. Never one blended number.</p>
          </div>
          <Link href="/finance" className="btn btn-primary">Open finance <span className="arrow">→</span></Link>
        </div>
        <div className="kpi-grid kpi-grid-3">
          <div className="kpi is-accent">
            <span className="kpi-label">01 · Contracted</span>
            <span className="kpi-value">{contractedLabel}</span>
            <span className="kpi-sub">Client-approved scope</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">02 · Invoiced <span>{pct(totalInvoiced, totalContractedValue)}%</span></span>
            <span className="kpi-value">{money(totalInvoiced)}</span>
            <span className="kpi-sub">Of contracted value</span>
          </div>
          <div className="kpi is-good">
            <span className="kpi-label">03 · Collected <span>{pct(totalCollected, totalInvoiced)}%</span></span>
            <span className="kpi-value">{money(totalCollected)}</span>
            <span className="kpi-sub">Of invoiced value</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">04 · Committed</span>
            <span className="kpi-value">{committedLabel}</span>
            <span className="kpi-sub">Open supplier POs</span>
          </div>
          <div className="kpi is-danger">
            <span className="kpi-label">05 · Actual spend</span>
            <span className="kpi-value">{money(totalActualCost)}</span>
            <span className="kpi-sub">Billed supplier costs</span>
          </div>
          <div className="kpi is-good">
            <span className="kpi-label">06 · Projected profit <span>{pct(totalProjectedMargin, totalContractedValue)}%</span></span>
            <span className="kpi-value">{money(totalProjectedMargin)}</span>
            <span className="kpi-sub">Contract − (committed + actual)</span>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <span className="section-index">Cash alerts</span>
            <h2>Overdue payments</h2>
          </div>
          <div className="row" style={{ gap: "0.5rem" }}>
            <span className={overdueInvoices.length ? "badge badge-danger" : "badge badge-good"}>
              {overdueInvoices.length ? `${overdueInvoices.length} overdue` : "All clear"}
            </span>
            <Link href="/finance/receivables" className="btn btn-ghost">Receivables <span className="arrow">→</span></Link>
          </div>
        </div>
        {overdueInvoices.length === 0 ? (
          <p className="empty">All client invoices and payment milestones are up to date.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Project</th>
                  <th>Milestone</th>
                  <th>Amount</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((inv) => {
                  const p = inv.projectId as unknown as { _id?: unknown; code?: string; name?: string } | null;
                  return (
                    <tr key={inv._id.toString()}>
                      <td className="mono">{inv.invoiceNumber}</td>
                      <td>
                        {p ? (
                          <Link href={`/projects/${p._id?.toString()}/commercials`} className="row-link">
                            {p.code} · {p.name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="muted">{inv.milestoneTitle}</td>
                      <td className="mono danger-text">{money(inv.amount)}</td>
                      <td className="muted">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
