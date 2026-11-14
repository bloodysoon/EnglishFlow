import type { AuthDictionary } from "./types";

export const ru: AuthDictionary = {
  meta: { loginTitle: "Вход", registerTitle: "Регистрация" },

  login: {
    sticker: "С возвращением в Elevo",
    titleLine1: "Снова здесь?",
    titleLine2: "Продолжим.",
    lead: "Каждое слово приближает к цели.",
    leadHighlight: "Продолжай с того места, где остановился.",
  },

  register: {
    sticker: "Добро пожаловать в Elevo",
    titleLine1: "Хватит листать.",
    titleLine2: "Начни запоминать.",
    lead: "Английский сам себя не выучит.",
    leadHighlight: "Давай это исправим.",
  },

  form: {
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Пароль",
    passwordPlaceholder: "Твой пароль",
    showPassword: "Показать",
    hidePassword: "Скрыть",
    passwordSuffix: "пароль",
    passwordHint: "От {min} до {max} символов.",
    logIn: "Войти →",
    loggingIn: "Входим...",
    noAccount: "Нет аккаунта?",
    createAccountLink: "Создать аккаунт",
    createAccount: "Регистрация →",
    creatingAccount: "Создаём аккаунт...",
    wait: "Подожди {seconds} с",
    haveAccount: "Уже есть аккаунт?",
    logInLink: "Войти",
    retryEnded: "Можно попробовать снова.",
  },

  success: {
    title: "Проверь почту!",
    bodyBefore: "Если этот адрес можно использовать, ссылка для подтверждения уже летит на ",
    bodyAfter: ". Открой её, чтобы активировать аккаунт.",
    spam: "Письма нет через несколько минут? Проверь папку «Спам». Уже есть аккаунт? Просто войди.",
    goToLogin: "Перейти ко входу →",
  },

  errors: {
    required: "Введи email и пароль.",
    email_not_confirmed: "Сначала подтверди email по ссылке из письма.",
    invalid_credentials: "Неверный email или пароль.",
    invalid_data: "Проверь email и пароль.",
    unavailable: "Регистрация временно недоступна.",
    rate_limited: "Слишком много попыток. Подожди немного и попробуй снова.",
    registration_failed: "Не удалось зарегистрироваться. Попробуй ещё раз.",
    password_too_long: "Пароль должен быть не длиннее {max} символов.",
    invalid_callback:
      "Ссылка подтверждения неполная. Открой последнюю ссылку из письма или войди, если уже подтвердил почту.",
    confirmation_failed:
      "Ссылка подтверждения устарела или уже использована. Попробуй войти или зарегистрируйся снова, чтобы получить новую.",
    unexpected: "Что-то пошло не так. Попробуй ещё раз.",
  },
};
