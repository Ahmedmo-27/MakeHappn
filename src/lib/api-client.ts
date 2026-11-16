import "server-only";
import { auth } from "@/lib/auth";
import { signApiToken } from "@/lib/api-token";
import { findTestUserById } from "@/lib/test-roster";

function baseUrl() {
  return (process.env.API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
}

async function bearer() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const test = findTestUserById(session.user.id);
  return signApiToken(
    {
      sub: session.user.id,
      role: session.user.role,
      teamId: session.user.teamId ?? null,
      name: session.user.name ?? test?.name,
      email: session.user.email ?? test?.email,
      test: Boolean(test),
    },
    secret,
  );
}

export async function api<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown; query?: Record<string, string | number | boolean | null | undefined> },
): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  for (const [key, value] of Object.entries(init?.query ?? {})) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
    headers: {
      authorization: `Bearer ${await bearer()}`,
      "content-type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.error || "The studio API could not complete that request");
  return data as T;
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch(`${baseUrl()}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return data as { id: string; name: string; email: string; role: string; teamId: string | null };
}
