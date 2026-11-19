import type { AuthDictionary } from "./types";

export const en: AuthDictionary = {
  meta: { loginTitle: "Log in", registerTitle: "Create account" },

  login: {
    sticker: "Welcome back to Elevo",
    titleLine1: "Back for more?",
    titleLine2: "Let's keep going.",
    lead: "Every word brings you closer.",
    leadHighlight: "Pick up where you left off.",
  },

  register: {
    sticker: "Welcome to Elevo",
    titleLine1: "Your first set",
    titleLine2: "is waiting.",
    lead: "Create an account and start with a ready-made word set.",
    leadHighlight: "Free to start.",
  },

  form: {
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    showPassword: "Show",
    hidePassword: "Hide",
    passwordSuffix: "password",
    passwordHint: "{min} to {max} characters.",
    logIn: "Log in →",
    loggingIn: "Logging in...",
    noAccount: "Don't have an account?",
    createAccountLink: "Create account",
    createAccount: "Create account →",
    creatingAccount: "Creating account...",
    wait: "Wait {seconds}s",
    haveAccount: "Already have an account?",
    logInLink: "Log in",
    retryEnded: "You can try again now.",
  },

  success: {
    title: "Check your inbox!",
    bodyBefore: "If this address can be used, a confirmation link is on its way to ",
    bodyAfter: ". Open it to activate your account.",
    spam: "Nothing after a few minutes? Check your spam folder. Already have an account? Just log in.",
    goToLogin: "Go to login →",
  },

  errors: {
    required: "Email and password are required.",
    email_not_confirmed: "Please confirm your email before signing in.",
    invalid_credentials: "Invalid email or password.",
    invalid_data: "Please check your email and password.",
    unavailable: "Registration is temporarily unavailable.",
    rate_limited: "Too many attempts. Please wait before trying again.",
    registration_failed: "Registration failed. Please try again.",
    password_too_long: "Password must be {max} characters or fewer.",
    invalid_callback:
      "That confirmation link is incomplete. Open the latest link from your email, or log in if you've already confirmed.",
    confirmation_failed:
      "That confirmation link has expired or was already used. Try logging in, or register again to get a new link.",
    unexpected: "Something went wrong. Please try again.",
  },
};
