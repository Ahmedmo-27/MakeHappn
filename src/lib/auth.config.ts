import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/domain";

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const loggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      // Public marketing home; its CTA leads to /login (or the dashboard when signed in)
      if (pathname === "/") return true;
      if (pathname === "/login") {
        if (loggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }
      return loggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teamId = user.teamId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.role = (token.role as Role | undefined) ?? "member";
      session.user.teamId = (token.teamId as string | null | undefined) ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
