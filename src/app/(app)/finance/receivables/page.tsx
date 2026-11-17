import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { formatCurrency, formatDate, readMessage } from "@/lib/format";
import { orEmpty } from "@/lib/db";
import { canViewFinance } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { financeSnapshot } from "@/services/studio-ops";

export default function FinanceReceivablesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading receivables" />}>
      <FinanceReceivables searchParams={searchParams} />
    </Suspense>
  );
}

async function FinanceReceivables({
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
      <section className="panel">
        <div className="section-head">
          <h2>Invoices</h2>
        </div>
        <div className="stack">
          {snapshot.invoices.length === 0 ? (
            <p className="muted">No invoices recorded yet.</p>
          ) : (
            snapshot.invoices.map((invoice) => {
              const project = invoice.projectId as unknown as { code?: string } | null;
              return (
                <p key={String(invoice._id)} className="muted">
                  {invoice.invoiceNumber} · {project?.code} · {formatCurrency(invoice.amount, "USD")} · {invoice.status}
                  {invoice.dueDate ? ` · due ${formatDate(invoice.dueDate)}` : ""}
                </p>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}