import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { getProjectById } from "@/services/projects";
import { getProjectCommercials } from "@/services/commercial";

export default function ProjectCommercialsOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading commercials overview" />}>
      <ProjectCommercialsOverview params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectCommercialsOverview({
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

  const { financialSummary, purchaseOrders, supplierBills, invoices } = commercials;
  const curr = financialSummary.currency;

  const sections = [
    {
      href: `/projects/${id}/commercials/pos`,
      title: "Purchase Orders",
      description: "Committed agreements with collective partners and suppliers.",
      count: purchaseOrders.length,
      countLabel: "active POs",
    },
    {
      href: `/projects/${id}/commercials/bills`,
      title: "Supplier Bills",
      description: "Incoming invoices recorded against purchase orders.",
      count: supplierBills.length,
      countLabel: "bills logged",
    },
    {
      href: `/projects/${id}/commercials/invoices`,
      title: "Client Invoices",
      description: "Milestone billing and payment collections from the client.",
      count: invoices.length,
      countLabel: "milestone invoices",
    },
  ];

  return (
  <>
      <Banner error={error} notice={notice} />

      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Tri-Partite Financial Engine & Cost Control</h2>
        <p className="hint" style={{ margin: "0.25rem 0" }}>
          Mandatory 3-tier financial model separating Estimated Budget, Committed POs, and Actual Incurred Expenses.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
            1. APPROVED CONTRACT VALUE
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--accent)" }}>
            {curr} {financialSummary.contractValue.toLocaleString()}
          </div>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Quoted: {curr} {(project.quotedValue || 0).toLocaleString()}
          </span>
        </div>

        <div className="card" style={{ background: "var(--surface-2)" }}>
          <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
            2. COMMITTED PO LIABILITIES
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--warn)" }}>
            {curr} {financialSummary.openCommittedPOCosts.toLocaleString()}
          </div>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Active open PO balances
          </span>
        </div>

        <div className="card" style={{ background: "var(--surface-2)" }}>
          <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
            3. ACTUAL INCURRED COSTS
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--danger)" }}>
            {curr} {financialSummary.actualIncurredCosts.toLocaleString()}
          </div>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Invoiced supplier bills
          </span>
        </div>

        <div className="card" style={{ background: "var(--good-soft)", border: "1px solid rgba(123, 227, 165, 0.3)" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--good)" }}>PROJECTED GROSS MARGIN</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0", color: "var(--good)" }}>
            {curr} {financialSummary.projectedGrossMargin.toLocaleString()}
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--good)" }}>
            {financialSummary.projectedMarginPercent.toFixed(1)}% Realized Margin
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="card stack" style={{ gap: "0.5rem", textDecoration: "none" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--ink)" }}>{section.title}</h3>
            <p className="hint" style={{ margin: 0, fontSize: "0.85rem" }}>
              {section.description}
            </p>
            <span className="muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              {section.count} {section.countLabel} →
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}