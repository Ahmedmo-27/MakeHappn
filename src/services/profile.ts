import type { FunctionalRole, Role } from "@/lib/domain";
import { api } from "@/lib/api-client";

export interface EmployeeProfile {
  name: string;
  email: string;
  role: Role;
  title: string;
  functionalRoles: FunctionalRole[];
  phone: string;
  bio: string;
  profileImage: string;
}

export function getOwnProfile() {
  return api<EmployeeProfile>("/me/profile");
}

export function updateOwnProfile(input: {
  phone: string;
  bio: string;
  profileImage?: string;
}) {
  return api<EmployeeProfile>("/me/profile", { body: input });
}
