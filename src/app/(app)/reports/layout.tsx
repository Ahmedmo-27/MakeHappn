import { ModuleTabs } from "@/components/module-tabs";

const tabs = [
  { href: "/reports", label: "Summary", exact: true },
  { href: "/reports/revenue", label: "Revenue" },
  { href: "/reports/delivery", label: "Delivery" },
  { href: "/reports/profitability", label: "Profitability" },
  { href: "/reports/clients", label: "Clients" },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page stack" style={{ gap: "2rem" }}>
      <header className="page-header">
        <div>
          <p className="eyebrow">Studio Analytics & Performance</p>
          <h1 className="page-title">Executive Reports</h1>
        </div>
        <p className="lead">
          Cross-cutting visibility into revenue mix, cost variances, sales conversion, and 3-lane studio delivery
          capacity. Figures stay in their own currency.
        </p>
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="Report sections" style={{ marginBottom: "0.5rem" }} />
      {children}
    </div>
  );
}