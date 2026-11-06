export type ActionResult = { ok: true; notice?: string } | { ok: false; error: string };

export function messageOf(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  ) {
    return "That name or email is already in use";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong";
}
