import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import { findTestUserByEmail } from "@/lib/test-roster";
import { User } from "@/models/User";

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
          await connectDB();
          const user = await User.findOne({ email }).select("+passwordHash");
          if (!user?.passwordHash) return null;

          const matches = await bcrypt.compare(password, user.passwordHash);
          if (!matches) return null;

          return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            teamId: user.teamId ? String(user.teamId) : null,
          };
        } catch (error) {
          console.error("[auth] credential check failed", error);
          return null;
        }
      },
    }),
  ],
});
