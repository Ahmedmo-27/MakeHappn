import Link from "next/link";
import { Suspense } from "react";
import { Banner, PageFallback } from "@/components/banner";
import { PersonForm } from "@/components/person-form";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { testPeopleView } from "@/lib/test-roster";
import { listPeople } from "@/services/org";

export default function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading form" />}>
      <NewPerson searchParams={searchParams} />
    </Suspense>
  );
}

async function NewPerson({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const [flash, loaded] = await Promise.all([
    searchParams.then(readMessage),
    orEmpty(() => listPeople(), null),
  ]);
  const data = loaded ?? testPeopleView();

  return (
    <>
      <Banner error={flash.error ?? (loaded ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/people">← Back to directory</Link>
      </p>
      <section className="card form-card">
        <div className="form-header" style={{ marginBottom: "1rem" }}>
          <h2 className="form-title">Add a person</h2>
          <p className="form-subtitle">Invite or register studio team members, leads, and directors.</p>
        </div>
        <PersonForm teams={data.teams} people={data.people} />
      </section>
    </>
  );
}
