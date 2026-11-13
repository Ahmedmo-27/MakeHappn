import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions";
import { findTestUserById, sessionFromTestUser } from "@/lib/test-roster";
import { User } from "@/models/User";

export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const testUser = findTestUserById(session.user.id);
  if (testUser) return sessionFromTestUser(testUser);

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) redirect("/login");

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title ?? "",
    isExecutive: user.isExecutive ?? user.role === "owner",
    functionalRoles: user.functionalRoles ?? [],
    laneIds: (user.laneIds ?? []).map(String),
    teamId: user.teamId ? String(user.teamId) : null,
  };
});

export async function requireOwner(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user.role !== "owner" && !user.isExecutive) redirect("/dashboard");
  return user;
}
