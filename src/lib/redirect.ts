import "server-only";
import { redirect } from "next/navigation";

export function redirectWith(path: string, message?: { error?: string; notice?: string }): never {
  const params = new URLSearchParams();
  if (message?.error) params.set("error", message.error);
  if (message?.notice) params.set("notice", message.notice);
  const query = params.toString();
  redirect(query ? `${path}?${query}` : path);
}
