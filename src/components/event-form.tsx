"use client";

import { useActionState } from "react";
import { createEventAction } from "@/app/actions/events";
import { SubmitButton } from "@/components/submit-button";
import type { ActionResult } from "@/lib/result";

export function EventForm({
  types,
  teams,
}: {
  types: { id: string; name: string }[];
  teams: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(createEventAction, null as ActionResult | null);

  return (
    <form action={formAction} className="form-grid panel">
      <label className="field">
        <span>Experience name</span>
        <input className="input" name="name" required placeholder="District 5 experience" />
      </label>
      <label className="field">
        <span>Type</span>
        <select className="select" name="typeId" required defaultValue="">
          <option value="" disabled>Choose a type</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <p className="hint">The kind of experience. Manage these labels on Experience types.</p>
      </label>
      <fieldset className="check-list">
        <legend>Crews on this experience</legend>
        <p className="hint">Only checked teams can receive tasks. Each team&apos;s leader is emailed when the team is added.</p>
        {teams.map((team) => (
          <label key={team.id}>
            <input type="checkbox" name="teamIds" value={team.id} />
            {team.name}
          </label>
        ))}
      </fieldset>
      <div className="grid-2">
        <label className="field">
          <span>From</span>
          <input className="input" type="date" name="start" required />
        </label>
        <label className="field">
          <span>To</span>
          <input className="input" type="date" name="end" required />
        </label>
      </div>
      <p className="hint">The experience runs from the first date through the second. The end date cannot be before the start.</p>
      {state && !state.ok ? <p className="banner banner-error">{state.error}</p> : null}
      <SubmitButton>Start experience</SubmitButton>
    </form>
  );
}
