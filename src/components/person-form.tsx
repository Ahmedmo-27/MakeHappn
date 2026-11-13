"use client";

import { useActionState, useState } from "react";
import { createPersonAction, updatePersonAction } from "@/app/actions/org";
import type { Role } from "@/lib/domain";
import type { ActionResult } from "@/lib/result";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";

type TeamOption = { id: string; name: string; leaderId: string | null };

export function PersonForm({
  teams,
  person,
  people = [],
}: {
  teams: TeamOption[];
  person?: {
    id: string;
    name: string;
    email: string;
    title?: string;
    role: Role;
    teamId: string | null;
    jobDescription?: string;
    weeklyCapacityHours?: number;
    reportsToId?: string | null;
  };
  people?: { id: string; name: string }[];
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
        <span>Job Title / Functional Role</span>
        <input className="input" name="title" defaultValue={person?.title} placeholder="e.g. Creative Lead, Project & Delivery Lead" />
      </label>
      <label className="field">
        <span>Job description</span>
        <textarea className="textarea" name="jobDescription" defaultValue={person?.jobDescription} rows={3} />
      </label>
      <label className="field">
        <span>Weekly capacity (hours)</span>
        <input className="input" name="weeklyCapacityHours" type="number" min="0" max="80" defaultValue={person?.weeklyCapacityHours ?? 40} />
      </label>
      <label className="field">
        <span>Reports to</span>
        <select className="select" name="reportsToId" defaultValue={person?.reportsToId ?? ""}>
          <option value="">No manager</option>
          {(people ?? []).filter((candidate) => candidate.id !== person?.id).map((candidate) => (
            <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Email</span>
        <input className="input" name="email" type="email" defaultValue={person?.email} required />
      </label>
      <label className="field">
        <span>{person ? "New password" : "Password"}</span>
        <PasswordInput autoComplete="new-password" required={!person} minLength={person ? undefined : 8} />
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
      <div className="form-actions">
        <SubmitButton>{person ? "Save person" : "Add person"}</SubmitButton>
      </div>
    </form>
  );
}
