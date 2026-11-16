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
    redirect("/login");
  }
});

export async function requireOwner(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user.role !== "owner" && !user.isExecutive) redirect("/dashboard");
  return user;
}
