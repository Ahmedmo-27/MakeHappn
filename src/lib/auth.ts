import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { apiLogin } from "@/lib/api-client";
import type { Role } from "@/lib/domain";
import { findTestUserByEmail } from "@/lib/test-roster";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const testUser = findTestUserByEmail(email);
        if (testUser) {
          if (password !== testUser.password) return null;
          return {
            id: testUser.id,
            name: testUser.name,
            email: testUser.email,
            role: testUser.role,
            teamId: testUser.teamId,
          };
        }

        try {
          const user = await apiLogin(email, password);
          if (!user) return null;
          return { ...user, role: user.role as Role };
        } catch (error) {
          console.error("[auth] credential check failed", error);
          return null;
        }
      },
    }),
  ],
});
