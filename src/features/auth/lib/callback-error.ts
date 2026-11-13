// Error codes the /auth/callback route can put in `/login?error=...`.
// Only known codes map to a message: arbitrary text from the URL is never
// rendered, so a crafted link can't show users a fake message.
const CALLBACK_ERROR_MESSAGES = {
  invalid_callback:
    "That confirmation link is incomplete. Open the latest link from your email, or log in if you've already confirmed.",
  confirmation_failed:
    "That confirmation link has expired or was already used. Try logging in, or register again to get a new link.",
} as const;

export function getCallbackErrorMessage(
  code: string | string[] | undefined,
): string | null {
  if (typeof code !== "string") return null;

  return Object.hasOwn(CALLBACK_ERROR_MESSAGES, code)
    ? CALLBACK_ERROR_MESSAGES[code as keyof typeof CALLBACK_ERROR_MESSAGES]
    : null;
}
