import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { api } from "@/lib/api-client";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/permissions";
import { findTestUserById, sessionFromTestUser } from "@/lib/test-roster";

export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const testUser = findTestUserById(session.user.id);
  if (testUser) return sessionFromTestUser(testUser);

  try {
    return await api<SessionUser>("/auth/me");
  } catch {
    // Keep the JWT session usable when the API is briefly unreachable
    // (Instant validation, cold start). Only an absent session should bounce to login.
    return {
      id: session.user.id,
      name: session.user.name ?? "Studio member",
      email: session.user.email ?? "",
      role: session.user.role ?? "member",
      teamId: session.user.teamId ?? null,
    };
  }
});

export async function requireOwner(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user.role !== "owner" && !user.isExecutive) redirect("/dashboard");
  return user;
}
