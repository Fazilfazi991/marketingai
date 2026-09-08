import { createHash, timingSafeEqual } from "node:crypto";

export function matchesWebhookSecret(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const left = createHash("sha256").update(received).digest(), right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}
