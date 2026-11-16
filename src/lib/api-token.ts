import { createHmac } from "node:crypto";

export function signApiToken(
  payload: {
    sub: string;
    role: string;
    teamId: string | null;
    name?: string | null;
    email?: string | null;
    test?: boolean;
  },
  secret: string,
) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 60 * 60 * 1000 })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}
