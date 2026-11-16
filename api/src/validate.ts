import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "@/http";

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      next(new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request"));
      return;
    }
    req.body = parsed.data;
    next();
  };
}
