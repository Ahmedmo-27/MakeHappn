"use client";

import { useActionState, useState } from "react";
import { createPersonAction, updatePersonAction } from "@/app/actions/org";
import type { Role } from "@/lib/domain";
import type { ActionResult } from "@/lib/result";
import { SubmitButton } from "@/components/submit-button";

type TeamOption = { id: string; name: string; leaderId: string | null };

export function PersonForm({
  teams,
  person,
}: {
  teams: TeamOption[];
  person?: { id: string; name: string; email: string; role: Role; teamId: string | null };
}) {
  const action = person ? updatePersonAction : createPersonAction;
  const [state, formAction] = useActionState(action, null as ActionResult | null);
  const [role, setRole] = useState<Role>(person?.role ?? "member");
  const [teamId, setTeamId] = useState(person?.teamId ?? "");
  const selected = teams.find((team) => team.id === teamId);
  const leaderTaken =
    role === "leader" && selected?.leaderId && selected.leaderId !== person?.id;

  return (
    <form action={formAction} className="form-grid">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      <label className="field">
        <span>Name</span>
        <input className="input" name="name" defaultValue={person?.name} required />
      </label>
      <label className="field">
        <span>Email</span>
        <input className="input" name="email" type="email" defaultValue={person?.email} required />
      </label>
      <label className="field">
        <span>{person ? "New password" : "Password"}</span>
        <input className="input" name="password" type="password" minLength={person ? undefined : 8} required={!person} autoComplete="new-password" />
        <p className="hint">{person ? "Leave this blank to keep the current password. A new password is what they will use to sign in." : "This is the password they use to sign in."}</p>
      </label>
      <label className="field">
        <span>Role</span>
        <select className="select" name="role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option value="member">Member</option>
          <option value="leader">Team leader</option>
          <option value="owner">Owner</option>
        </select>
        <p className="hint">
          {role === "member"
            ? "A member belongs to one team and moves only the tasks assigned to them."
            : role === "leader"
              ? "A team has one leader. They assign that team's tasks and track each member."
              : "An owner has no team. They start experiences and can see every crew's work."}
        </p>
      </label>
      {role !== "owner" ? (
        <label className="field">
          <span>Team</span>
          <select className="select" name="teamId" value={teamId} onChange={(event) => setTeamId(event.target.value)} required>
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      {leaderTaken ? <p className="banner banner-error">That team already has a leader. Promote someone from the Teams page instead, or pick another team.</p> : null}
      {state && !state.ok ? <p className="banner banner-error">{state.error}</p> : null}
      <SubmitButton>{person ? "Save person" : "Add person"}</SubmitButton>
    </form>
  );
}
