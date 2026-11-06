import { Suspense } from "react";
import { createEventTypeAction, renameEventTypeAction } from "@/app/actions/org";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { listEventTypes } from "@/services/org";

export default function EventTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading event types" /></div>}>
      <EventTypes searchParams={searchParams} />
    </Suspense>
  );
}

async function EventTypes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const [flash, types] = await Promise.all([searchParams.then(readMessage), listEventTypes()]);

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Catalog</p>
          <h1>Experience types</h1>
          <p className="lede">A type is the label chosen when an experience starts, such as a brand experience, pop-up, or installation. Add another when a new kind of work comes up.</p>
        </div>
      </header>
      <form action={createEventTypeAction} className="row panel">
        <label className="field" style={{ flex: 1 }}>
          <span>New type</span>
          <input className="input" name="name" required placeholder="Festival" />
        </label>
        <SubmitButton>Add type</SubmitButton>
      </form>
      <div className="stack" style={{ marginTop: "1rem" }}>
        {types.map((type) => (
          <form key={type.id} action={renameEventTypeAction} className="row panel">
            <input type="hidden" name="typeId" value={type.id} />
            <label className="field" style={{ flex: 1 }}>
              <span>Name</span>
              <input className="input" name="name" defaultValue={type.name} required />
            </label>
            <SubmitButton variant="ghost">Rename</SubmitButton>
          </form>
        ))}
      </div>
    </div>
  );
}
