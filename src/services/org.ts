import type { FunctionalRole, Role } from "@/lib/domain";
import { api } from "@/lib/api-client";

export function listPeople() {
  return api<{
    people: Array<{
      id: string;
      name: string;
      email: string;
      role: Role;
      title: string;
      profileImage?: string;
      functionalRoles: FunctionalRole[];
      jobDescription: string;
      weeklyCapacityHours: number;
      reportsToId: string | null;
      teamId: string | null;
      teamName: string | null;
    }>;
    teams: any[];
  }>("/org/people");
}

export function listDirectory() {
  return api<{ users: Array<{ _id: unknown; name: string; title?: string }>; clients: Array<{ _id: unknown; name: string; brandName?: string; contacts: any[] }>; teams: any[] }>("/org/directory");
}

export function ensureStudioClient() {
  return api<any[]>("/clients/ensure", { method: "POST", body: {} });
}

export function updateClient(id: string, input: unknown) {
  return api<any>(`/clients/${id}`, { method: "PATCH", body: input });
}

export function resolvePhaseLeads() {
  return api<Record<string, string>>("/org/phase-leads");
}

export function listTeamsWithPeople() {
  return api<Array<{ id: string; name: string; leaderId: string | null; people: any[] }>>("/org/teams");
}

export function createPerson(input: unknown) {
  return api<any>("/org/people", { body: input });
}

export function updatePerson(input: { id: string } & Record<string, unknown>) {
  return api<any>(`/org/people/${input.id}`, { method: "PATCH", body: input });
}

export function createTeam(name: string) {
  return api<any>("/org/teams", { body: { name } });
}

export function renameTeam(teamId: string, name: string) {
  return api<any>(`/org/teams/${teamId}`, { method: "PATCH", body: { name } });
}

export function promoteLeader(teamId: string, userId: string) {
  return api<any>(`/org/teams/${teamId}/leader`, { body: { userId } });
}
