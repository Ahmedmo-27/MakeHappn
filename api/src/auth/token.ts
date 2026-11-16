import { createHmac, timingSafeEqual } from "node:crypto";

export type TokenClaims = {
  sub: string;
  role: string;
  teamId: string | null;
  name?: string;
  email?: string;
  test?: boolean;
  exp: number;
};

export function signToken(payload: Omit<TokenClaims, "exp">, secret: string, ttlMs = 60 * 60 * 1000) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string, secret: string): TokenClaims {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Unauthorized");
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("Unauthorized");
  const claims = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenClaims;
  if (!claims.exp || claims.exp < Date.now()) throw new Error("Unauthorized");
  return claims;
}
