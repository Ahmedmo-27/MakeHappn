import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/domain";

declare module "next-auth" {
  interface User {
    role: Role;
    teamId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      teamId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    teamId?: string | null;
  }
}

export {};
