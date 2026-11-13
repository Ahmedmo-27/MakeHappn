import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency, formatDate, readMessage } from "@/lib/format";
import { orEmpty } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createExpenseFormAction } from "@/app/actions/studio-ops";
import { financeSnapshot } from "@/services/studio-ops";

export default function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading finance" /></div>}>
      <Finance searchParams={searchParams} />
    </Suspense>
  );
}

function inPeriod(date: Date | null | undefined, start: Date) {
  if (!date) return false;
  return new Date(date) >= start;
}

async function Finance({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);
  const period = typeof params.period === "string" ? params.period : "quarter";
  const canSee = user.role === "owner" || !!user.isExecutive || user.functionalRoles?.includes("finance_operations");
  const now = new Date();
  const start = new Date(now);
  if (period === "month") start.setMonth(now.getMonth() - 1);
  else if (period === "year") start.setFullYear(now.getFullYear() - 1);
  else start.setMonth(now.getMonth() - 3);

  if (!canSee) {
    return (
      <div className="page">
        <header className="page-header"><h1>Finance</h1></header>
        <p className="lede">Company financials are visible to the founder, executives, and finance.</p>
      </div>
    );
  }

  const snapshot = await orEmpty(() => financeSnapshot(), {
    invoices: [],
    bills: [],
    orders: [],
    projects: [],
    expenses: [],
  });

  const invoices = snapshot.invoices.filter((invoice) => inPeriod(invoice.createdAt, start) || inPeriod(invoice.dueDate, start));
  const expenses = snapshot.expenses.filter((expense) => inPeriod(expense.incurredAt, start));
  const bills = snapshot.bills;
  const collected = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const outstanding = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "not_invoiced").reduce((sum, invoice) => sum + invoice.amount, 0);
  const payables = bills.filter((bill) => bill.status !== "paid").reduce((sum, bill) => sum + bill.amount, 0);
  const paidBills = bills.filter((bill) => bill.status === "paid").reduce((sum, bill) => sum + bill.amount, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const cash = collected - paidBills - expenseTotal;
  const live = snapshot.projects.filter((project) => project.status !== "closed");

  const months = new Map<string, { invoiced: number; collected: number }>();
  for (const invoice of snapshot.invoices) {
    const key = new Date(invoice.createdAt).toLocaleString("en", { month: "short", year: "numeric" });
    const row = months.get(key) ?? { invoiced: 0, collected: 0 };
    row.invoiced += invoice.amount;
    if (invoice.status === "paid") row.collected += invoice.amount;
    months.set(key, row);
  }

  return (
    <div className="page page-wide">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Financial control</p>
          <h1>Finance</h1>
          <p className="lede">Receivables, payables, project budgets, and the cash position for the selected period.</p>
        </div>
      </header>
      <nav className="segmented" aria-label="Reporting period">
        {["month", "quarter", "year"].map((item) => (
          <Link key={item} href={`/finance?period=${item}`} className={period === item ? "active" : undefined}>{item}</Link>
        ))}
      </nav>
      <div className="kpi-grid">
        <div className="kpi"><span className="kpi-label">Collected</span><span className="kpi-value">{formatCurrency(collected, "USD")}</span></div>
        <div className="kpi"><span className="kpi-label">Outstanding receivables</span><span className="kpi-value">{formatCurrency(outstanding, "USD")}</span></div>
        <div className="kpi"><span className="kpi-label">Supplier payables</span><span className="kpi-value">{formatCurrency(payables, "USD")}</span></div>
        <div className="kpi is-accent"><span className="kpi-label">Cash after paid costs</span><span className="kpi-value">{formatCurrency(cash, "USD")}</span><span className="kpi-sub">Collected minus paid bills and expenses</span></div>
      </div>

      <div className="split">
        <section className="panel">
          <div className="section-head"><h2>Project budgets</h2></div>
          <div className="stack">
            {live.map((project) => {
              const revenue = project.approvedContractValue || project.quotedValue || 0;
              const cost = (project.actualTotalCost || 0) + (project.committedTotalCost || 0);
              return (
                <Link key={String(project._id)} href={`/projects/${project._id}/commercials`} className="attn-row">
                  <span className="attn-main">
                    <strong>{project.code} · {project.name}</strong>
                    <span>Estimate {formatCurrency(project.estimatedTotalCost || 0, project.currency)} · committed+actual {formatCurrency(cost, project.currency)}</span>
                  </span>
                  <span className="badge">{formatCurrency(revenue - cost, project.currency)}</span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="stack">
          <div className="card form-card">
            <h2>Record an expense</h2>
            <form action={createExpenseFormAction} className="stack">
              <label className="field"><span>Description</span><input className="input" name="description" required /></label>
              <label className="field"><span>Category</span><input className="input" name="category" placeholder="Travel, materials, petty cash" /></label>
              <label className="field"><span>Amount</span><input className="input" name="amount" type="number" min="0" step="0.01" required /></label>
              <label className="field"><span>Date</span><input className="input" name="incurredAt" type="date" required /></label>
              <label className="field">
                <span>Project</span>
                <select className="select" name="projectId">
                  <option value="">Company expense</option>
                  {snapshot.projects.map((project) => (
                    <option key={String(project._id)} value={String(project._id)}>{project.code}</option>
                  ))}
                </select>
              </label>
              <SubmitButton>Save expense</SubmitButton>
            </form>
          </div>
          <div className="panel">
            <div className="section-head"><h2>Period report</h2></div>
            {[...months.entries()].slice(-6).map(([label, row]) => (
              <p key={label} className="muted">{label}: invoiced {formatCurrency(row.invoiced, "USD")} · collected {formatCurrency(row.collected, "USD")}</p>
            ))}
            <p className="hint">Expenses in this window: {formatCurrency(expenseTotal, "USD")}</p>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-head"><h2>Invoices and supplier bills</h2></div>
        <div className="stack">
          {invoices.map((invoice) => {
            const project = invoice.projectId as unknown as { code?: string } | null;
            return (
              <p key={String(invoice._id)} className="muted">
                {invoice.invoiceNumber} · {project?.code} · {formatCurrency(invoice.amount, "USD")} · {invoice.status}
                {invoice.dueDate ? ` · due ${formatDate(invoice.dueDate)}` : ""}
              </p>
            );
          })}
          {bills.map((bill) => (
            <p key={String(bill._id)} className="muted">Supplier bill {bill.billNumber} · {formatCurrency(bill.amount, "USD")} · {bill.status}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
