import { Suspense } from "react";
import { PageFallback } from "@/components/banner";
import { EventForm } from "@/components/event-form";
import { requireOwner } from "@/lib/session";
import { listCatalog } from "@/services/events";

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading the event form" /></div>}>
      <NewEvent />
    </Suspense>
  );
}

async function NewEvent() {
  await requireOwner();
  const catalog = await listCatalog();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="kicker">New experience</p>
          <h1>Start an experience</h1>
          <p className="lede">Name it, choose the type, assign the crews, and set the dates. Leaders are emailed when their team is added.</p>
        </div>
      </header>
      <EventForm types={catalog.types} teams={catalog.teams} />
    </div>
  );
}
