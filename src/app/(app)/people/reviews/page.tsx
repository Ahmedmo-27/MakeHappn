import { Suspense } from "react";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { testPeopleView } from "@/lib/test-roster";
import { listPeople } from "@/services/org";
import { createReviewFormAction } from "@/app/actions/studio-ops";
import { listReviews } from "@/services/studio-ops";

export default function PeopleReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading reviews" />}>
      <Reviews searchParams={searchParams} />
    </Suspense>
  );
}

async function Reviews({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const [flash, loaded, reviews] = await Promise.all([
    searchParams.then(readMessage),
    orEmpty(() => listPeople(), null),
    orEmpty(() => listReviews(), null),
  ]);
  const data = loaded ?? testPeopleView();
  const list = reviews ?? [];

  return (
    <>
      <Banner error={flash.error ?? (loaded && reviews ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <section className="card form-card">
        <h2>Performance review</h2>
        {list.map((review) => {
          const person = review.userId as unknown as { name?: string } | null;
          return <p key={String(review._id)} className="muted">{person?.name} · {review.period} · {review.rating}/5 · {review.kpiNotes}</p>;
        })}
        <form action={createReviewFormAction} className="stack" style={{ marginTop: "1rem" }}>
          <label className="field">
            <span>Person</span>
            <select className="select" name="userId" required>
              {data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Period</span><input className="input" name="period" placeholder="2026 Q4" required /></label>
          <label className="field"><span>KPIs</span><textarea className="textarea" name="kpiNotes" rows={2} /></label>
          <label className="field"><span>Training and development</span><textarea className="textarea" name="development" rows={2} /></label>
          <label className="field"><span>Rating 1–5</span><input className="input" name="rating" type="number" min="1" max="5" defaultValue={3} /></label>
          <SubmitButton>Save review</SubmitButton>
        </form>
      </section>
    </>
  );
}
