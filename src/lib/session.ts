import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions";
import { User } from "@/models/User";

export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) redirect("/login");

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId ? String(user.teamId) : null,
  };
});

export async function requireOwner(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user.role !== "owner") redirect("/dashboard");
  return user;
}
