import type { CallbackErrorCode } from "../errors";

// Error codes the /auth/callback route can put in `/login?error=...`.
// Only known codes are accepted: arbitrary text from the URL is never
// rendered, so a crafted link can't show users a fake message.
const CALLBACK_ERROR_CODES: readonly CallbackErrorCode[] = ["invalid_callback", "confirmation_failed"];

export function parseCallbackError(code: string | string[] | undefined): CallbackErrorCode | null {
  if (typeof code !== "string") return null;

  return CALLBACK_ERROR_CODES.find((known) => known === code) ?? null;
}
