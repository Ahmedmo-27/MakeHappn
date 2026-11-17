import { Suspense } from "react";
import { Banner, PageFallback } from "@/components/banner";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { formatDate, readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { setLeaveFormAction } from "@/app/actions/studio-ops";
import { listLeave } from "@/services/studio-ops";

export default function PeopleLeavePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading leave" />}>
      <Leave searchParams={searchParams} />
    </Suspense>
  );
}

async function Leave({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const [flash, leave] = await Promise.all([
    searchParams.then(readMessage),
    orEmpty(() => listLeave(), null),
  ]);
  const items = leave ?? [];

  return (
    <>
      <Banner error={flash.error ?? (leave ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <section className="panel">
        <h2>Leave</h2>
        {items.length === 0 ? <p className="muted">No leave requests yet.</p> : null}
        {items.map((item) => {
          const person = item.userId as unknown as { name?: string } | null;
          return (
            <div key={String(item._id)} className="row" style={{ marginBottom: "0.6rem" }}>
              <span>{person?.name} · {formatDate(item.startDate)} – {formatDate(item.endDate)} · {item.status}</span>
              {item.status === "requested" ? (
                <form action={setLeaveFormAction} className="row">
                  <input type="hidden" name="id" value={String(item._id)} />
                  <button className="btn btn-ghost" name="status" value="approved" type="submit">Approve</button>
                  <button className="btn btn-ghost" name="status" value="declined" type="submit">Decline</button>
                </form>
              ) : null}
            </div>
          );
        })}
      </section>
    </>
  );
}
