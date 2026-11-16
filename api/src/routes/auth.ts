import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { actor, requireUser } from "@/auth/middleware";
import { connectDB } from "@/lib/db";
import { HttpError } from "@/http";
import { User } from "@/models/User";
import { validate } from "@/validate";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    await connectDB();
    const email = String(req.body.email).toLowerCase().trim();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user?.passwordHash) throw new HttpError(401, "Those details don't match");
    const matches = await bcrypt.compare(String(req.body.password), user.passwordHash);
    if (!matches) throw new HttpError(401, "Those details don't match");
    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId ? String(user.teamId) : null,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireUser, (req, res) => {
  res.json(actor(req));
});
