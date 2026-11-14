import type { AuthDictionary } from "./types";

export const ro: AuthDictionary = {
  meta: { loginTitle: "Autentificare", registerTitle: "Creează cont" },

  login: {
    sticker: "Bine ai revenit în Elevo",
    titleLine1: "Te-ai întors?",
    titleLine2: "Hai să continuăm.",
    lead: "Fiecare cuvânt te aduce mai aproape.",
    leadHighlight: "Continuă de unde ai rămas.",
  },

  register: {
    sticker: "Bine ai venit în Elevo",
    titleLine1: "Gata cu scrollul.",
    titleLine2: "Începe să reții.",
    lead: "Engleza nu se învață singură.",
    leadHighlight: "Hai să schimbăm asta.",
  },

  form: {
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Parolă",
    passwordPlaceholder: "Parola ta",
    showPassword: "Arată",
    hidePassword: "Ascunde",
    passwordSuffix: "parola",
    passwordHint: "Între {min} și {max} caractere.",
    logIn: "Intră →",
    loggingIn: "Se conectează...",
    noAccount: "Nu ai cont?",
    createAccountLink: "Creează cont",
    createAccount: "Creează cont →",
    creatingAccount: "Se creează contul...",
    wait: "Așteaptă {seconds} s",
    haveAccount: "Ai deja cont?",
    logInLink: "Intră",
    retryEnded: "Poți încerca din nou.",
  },

  success: {
    title: "Verifică-ți emailul!",
    bodyBefore: "Dacă această adresă poate fi folosită, un link de confirmare este pe drum spre ",
    bodyAfter: ". Deschide-l ca să-ți activezi contul.",
    spam: "Nimic după câteva minute? Verifică folderul Spam. Ai deja cont? Doar intră.",
    goToLogin: "Mergi la autentificare →",
  },

  errors: {
    required: "Introdu emailul și parola.",
    email_not_confirmed: "Confirmă-ți mai întâi emailul din linkul primit.",
    invalid_credentials: "Email sau parolă greșită.",
    invalid_data: "Verifică emailul și parola.",
    unavailable: "Înregistrarea nu este disponibilă momentan.",
    rate_limited: "Prea multe încercări. Așteaptă puțin și încearcă din nou.",
    registration_failed: "Înregistrarea a eșuat. Încearcă din nou.",
    password_too_long: "Parola trebuie să aibă cel mult {max} caractere.",
    invalid_callback:
      "Linkul de confirmare este incomplet. Deschide ultimul link din email sau intră dacă ți-ai confirmat deja adresa.",
    confirmation_failed:
      "Linkul de confirmare a expirat sau a fost deja folosit. Încearcă să intri sau înregistrează-te din nou pentru un link nou.",
    unexpected: "Ceva n-a mers. Încearcă din nou.",
  },
};
