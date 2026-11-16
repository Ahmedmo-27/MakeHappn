import type { NextFunction, Request, Response } from "express";
import { connectDB } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions";
import { User } from "@/models/User";
import { HttpError } from "@/http";
import { verifyToken } from "@/auth/token";

export type AuthedRequest = Request & { user: SessionUser };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new HttpError(500, "AUTH_SECRET is not set");
  return value;
}

export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new HttpError(401, "Unauthorized");
    const claims = verifyToken(token, secret());
    if (claims.test) {
      (req as AuthedRequest).user = {
        id: claims.sub,
        name: claims.name ?? "Test user",
        email: claims.email ?? "",
        role: (claims.role as SessionUser["role"]) ?? "member",
        teamId: claims.teamId,
        isExecutive: claims.role === "owner",
        functionalRoles: [],
        laneIds: [],
      };
      next();
      return;
    }
    await connectDB();
    const user = await User.findById(claims.sub);
    if (!user) throw new HttpError(401, "Unauthorized");
    (req as AuthedRequest).user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title ?? "",
      isExecutive: user.isExecutive ?? user.role === "owner",
      functionalRoles: user.functionalRoles ?? [],
      laneIds: (user.laneIds ?? []).map(String),
      teamId: user.teamId ? String(user.teamId) : null,
    };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Unauthorized"));
  }
}

export function actor(req: Request) {
  return (req as AuthedRequest).user;
}
