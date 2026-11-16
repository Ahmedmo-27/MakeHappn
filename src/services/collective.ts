import type { CollectiveType } from "@/models/CollectiveMember";
import { api } from "@/lib/api-client";

export interface CollectiveRecord {
  _id: { toString(): string };
  name: string;
  type: CollectiveType;
  specialisms: any[];
  [key: string]: any;
}

export function listCollectiveMembers(type?: string) {
  return api<CollectiveRecord[]>("/collective", { query: { type } });
}

export function createCollectiveMember(input: unknown) {
  return api<any>("/collective", { body: input });
}

export function updateCollectiveMember(id: string, input: unknown) {
  return api<any>(`/collective/${id}`, { method: "PATCH", body: input });
}
