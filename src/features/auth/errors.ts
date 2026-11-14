// Auth failures travel as codes, not sentences: the server decides what
// went wrong, the page shows it in the visitor's language
// (features/i18n/auth). Keep this list in sync with those dictionaries.
export const AUTH_ERROR_CODES = [
  // log in
  "required",
  "email_not_confirmed",
  "invalid_credentials",
  // register
  "invalid_data",
  "unavailable",
  "rate_limited",
  "registration_failed",
  "password_too_long",
  // email confirmation link (/auth/callback)
  "invalid_callback",
  "confirmation_failed",
  // anything else
  "unexpected",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export type CallbackErrorCode = Extract<AuthErrorCode, "invalid_callback" | "confirmation_failed">;
