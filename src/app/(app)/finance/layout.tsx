import { ModuleTabs } from "@/components/module-tabs";

const tabs = [
  { href: "/finance", label: "Overview", exact: true },
  { href: "/finance/receivables", label: "Receivables" },
  { href: "/finance/payables", label: "Payables" },
  { href: "/finance/expenses", label: "Expenses" },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <p className="kicker">Financial control</p>
          <h1>Finance</h1>
          <p className="lede">Receivables, payables, project budgets, and the cash position for the selected period.</p>
        </div>
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="Finance sections" style={{ marginBottom: "1.5rem" }} />
      {children}
    </div>
  );
}