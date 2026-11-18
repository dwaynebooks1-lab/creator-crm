import { createHmac } from "crypto";

const SECRET = process.env.CRON_SECRET || "fallback-unsubscribe-key";

export function generateUnsubscribeToken(userId: string): string {
  const hmac = createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${Buffer.from(userId).toString("base64url")}.${hmac}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [b64, hmac] = token.split(".");
  if (!b64 || !hmac) return null;
  const userId = Buffer.from(b64, "base64url").toString();
  const expected = createHmac("sha256", SECRET).update(userId).digest("hex");
  if (hmac !== expected) return null;
  return userId;
}

export function unsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `https://creatorcrm.net/api/unsubscribe?token=${token}`;
}
