import type { AuthErrorCode } from "@/features/auth/errors";

type Pitch = {
  sticker: string;
  titleLine1: string;
  titleLine2: string;
  lead: string;
  leadHighlight: string;
};

// Every log-in / register string, per language. Plain strings with
// "{name}" placeholders (filled with `fill`) so the forms, which are
// Client Components, can receive them.
export type AuthDictionary = {
  meta: { loginTitle: string; registerTitle: string };

  login: Pitch;
  register: Pitch;

  form: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    passwordSuffix: string; // read after Show/Hide by screen readers
    passwordHint: string; // {min} {max}
    logIn: string;
    loggingIn: string;
    noAccount: string;
    createAccountLink: string;
    createAccount: string;
    creatingAccount: string;
    wait: string; // {seconds}
    haveAccount: string;
    logInLink: string;
    retryEnded: string;
  };

  success: {
    title: string;
    bodyBefore: string; // …{email}…
    bodyAfter: string;
    spam: string;
    goToLogin: string;
  };

  errors: Record<AuthErrorCode, string>;
};
