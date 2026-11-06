import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);
const handle = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent,
) => Promise<Response>;

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return handle(request, event);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
