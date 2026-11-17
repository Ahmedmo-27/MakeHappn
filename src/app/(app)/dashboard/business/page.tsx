import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { loadDashboardBundle, money } from "@/components/dashboard/shared";
import { getCurrentUser } from "@/lib/session";

export default function DashboardBusinessPage() {
  return (
    <Suspense fallback={<PageFallback label="Loading business view" />}>
      <BusinessView />
    </Suspense>
  );
}

async function BusinessView() {
  await connection();
  const user = await getCurrentUser();
  const {
    leads,
    openLeads,
    pipelineLabel,
    totalPipelineRevenue,
    productMetrics,
    maxProduct,
  } = await loadDashboardBundle(user);

  return (
    <div className="stack" style={{ gap: "1.6rem" }}>
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Open leads</span>
          <span className="kpi-value">{openLeads.length}</span>
          <span className="kpi-sub">Inquiry → proposal</span>
        </div>
        <div className="kpi is-accent">
          <span className="kpi-label">Pipeline value</span>
          <span className="kpi-value">{pipelineLabel}</span>
          <span className="kpi-sub">Not yet contracted</span>
        </div>
        <div className="kpi is-good">
          <span className="kpi-label">Won</span>
          <span className="kpi-value">{leads.filter((l) => l.stage === "won").length}</span>
          <span className="kpi-sub">Converted into projects</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Avg. deal size</span>
          <span className="kpi-value">{money(openLeads.length ? totalPipelineRevenue / openLeads.length : 0)}</span>
          <span className="kpi-sub">Across open leads</span>
        </div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <span className="section-index">Products</span>
            <h2>Where the business comes from</h2>
            <p>Contracted value (solid) and pipeline (outline) for each of the six studio products.</p>
          </div>
          <Link href="/sales" className="btn btn-primary">Open pipeline <span className="arrow">→</span></Link>
        </div>
        <div className="product-bars">
          {productMetrics.map((pm) => (
            <Link key={pm.product} href={`/projects?product=${pm.product}`} className="product-bar">
              <span className="product-name">{pm.label}</span>
              <span className="product-track">
                <span className="product-fill" style={{ width: `${(pm.contractedSum / maxProduct) * 100}%` }} />
                <span className="product-pipe" style={{ width: `${(pm.pipelineSum / maxProduct) * 100}%` }} />
              </span>
              <span className="product-nums">
                <strong>{money(pm.contractedSum)}</strong>
                <span>{pm.projectsCount} projects · {pm.leadsCount} leads</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
