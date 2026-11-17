import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency, formatDate, readMessage } from "@/lib/format";
import { orEmpty } from "@/lib/db";
import { canViewFinance } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { createExpenseFormAction } from "@/app/actions/studio-ops";
import { financeSnapshot } from "@/services/studio-ops";

export default function FinanceExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading expenses" />}>
      <FinanceExpenses searchParams={searchParams} />
    </Suspense>
  );
}

async function FinanceExpenses({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);

  if (!canViewFinance(user)) {
    return (
      <>
        <Banner error={flash.error} notice={flash.notice} />
        <p className="lede">Company financials are visible to the founder, executives, and finance.</p>
      </>
    );
  }

  const snapshot = await orEmpty(() => financeSnapshot(), {
    invoices: [],
    bills: [],
    orders: [],
    projects: [],
    expenses: [],
  });

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <div className="split">
        <section className="card form-card">
          <h2>Record an expense</h2>
          <form action={createExpenseFormAction} className="stack">
            <label className="field">
              <span>Description</span>
              <input className="input" name="description" required />
            </label>
            <label className="field">
              <span>Category</span>
              <input className="input" name="category" placeholder="Travel, materials, petty cash" />
            </label>
            <label className="field">
              <span>Amount</span>
              <input className="input" name="amount" type="number" min="0" step="0.01" required />
            </label>
            <label className="field">
              <span>Date</span>
              <input className="input" name="incurredAt" type="date" required />
            </label>
            <label className="field">
              <span>Project</span>
              <select className="select" name="projectId">
                <option value="">Company expense</option>
                {snapshot.projects.map((project) => (
                  <option key={String(project._id)} value={String(project._id)}>
                    {project.code}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton>Save expense</SubmitButton>
          </form>
        </section>
        <section className="panel">
          <div className="section-head">
            <h2>Recorded expenses</h2>
          </div>
          <div className="stack">
            {snapshot.expenses.length === 0 ? (
              <p className="muted">No expenses recorded yet.</p>
            ) : (
              snapshot.expenses.map((expense) => (
                <p key={String(expense._id)} className="muted">
                  {expense.description}
                  {expense.category ? ` · ${expense.category}` : ""} · {formatCurrency(expense.amount, "USD")}
                  {expense.incurredAt ? ` · ${formatDate(expense.incurredAt)}` : ""}
                </p>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}