import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { formatCurrency, readMessage } from "@/lib/format";
import { orEmpty } from "@/lib/db";
import { canViewFinance } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { financeSnapshot } from "@/services/studio-ops";

export default function FinancePayablesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading payables" />}>
      <FinancePayables searchParams={searchParams} />
    </Suspense>
  );
}

async function FinancePayables({
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
          <h2>Supplier bills</h2>
        </div>
        <div className="stack">
          {snapshot.bills.length === 0 ? (
            <p className="muted">No supplier bills recorded yet.</p>
          ) : (
            snapshot.bills.map((bill) => (
              <p key={String(bill._id)} className="muted">
                Supplier bill {bill.billNumber} · {formatCurrency(bill.amount, "USD")} · {bill.status}
              </p>
            ))
          )}
        </div>
      </section>
    </>
  );
}