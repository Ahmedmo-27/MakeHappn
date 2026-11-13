"use server";

import { AuthError } from "next-auth";
import { redirect, unstable_rethrow } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { field } from "@/lib/parse";

export async function login(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password" };

  if (!process.env.AUTH_SECRET) {
    return { error: "Sign-in is not configured. AUTH_SECRET is missing on the server." };
  }

  try {
    const destination = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/dashboard",
    });
    const next = sessionPath(destination);
    if (next) redirect(next);
    console.error("[auth] sign-in did not return a session redirect", destination);
    return { error: "Sign-in is not configured. Check AUTH_SECRET and restart the server." };
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password" };
    unstable_rethrow(error);
    return { error: "Could not sign in" };
  }
}

function sessionPath(destination: unknown): string | null {
  if (typeof destination !== "string" || destination.includes("/api/auth/")) return null;
  if (destination.startsWith("/") && !destination.startsWith("//")) return destination;
  try {
    const url = new URL(destination);
    if (url.pathname.startsWith("/api/auth/")) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
