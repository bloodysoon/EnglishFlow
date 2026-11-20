import type { AuthDictionary } from "./types";

export const id: AuthDictionary = {
  meta: { loginTitle: "Masuk", registerTitle: "Buat akun" },

  login: {
    sticker: "Selamat datang kembali di Elevo",
    titleLine1: "Kembali lagi?",
    titleLine2: "Ayo lanjutkan.",
    lead: "Setiap kata membawamu lebih dekat.",
    leadHighlight: "Lanjutkan dari terakhir kali.",
  },

  register: {
    sticker: "Selamat datang di Elevo",
    titleLine1: "Set pertamamu",
    titleLine2: "sudah menunggu.",
    lead: "Buat akun dan mulai dengan set kata yang sudah siap.",
    leadHighlight: "Gratis untuk memulai.",
  },

  form: {
    email: "Email",
    emailPlaceholder: "kamu@contoh.com",
    password: "Kata sandi",
    passwordPlaceholder: "Kata sandimu",
    showPassword: "Tampilkan",
    hidePassword: "Sembunyikan",
    passwordSuffix: "kata sandi",
    passwordHint: "{min} sampai {max} karakter.",
    logIn: "Masuk →",
    loggingIn: "Sedang masuk...",
    noAccount: "Belum punya akun?",
    createAccountLink: "Buat akun",
    createAccount: "Buat akun →",
    creatingAccount: "Membuat akun...",
    wait: "Tunggu {seconds} dtk",
    haveAccount: "Sudah punya akun?",
    logInLink: "Masuk",
    retryEnded: "Sekarang kamu bisa mencoba lagi.",
  },

  success: {
    title: "Cek kotak masukmu!",
    bodyBefore: "Jika alamat ini bisa digunakan, tautan konfirmasi sedang dikirim ke ",
    bodyAfter: ". Buka tautan itu untuk mengaktifkan akunmu.",
    spam: "Belum ada setelah beberapa menit? Cek folder spam. Sudah punya akun? Langsung masuk saja.",
    goToLogin: "Ke halaman masuk →",
  },

  errors: {
    required: "Email dan kata sandi wajib diisi.",
    email_not_confirmed: "Konfirmasi emailmu dulu sebelum masuk.",
    invalid_credentials: "Email atau kata sandi salah.",
    invalid_data: "Periksa lagi email dan kata sandimu.",
    unavailable: "Pendaftaran sedang tidak tersedia untuk sementara.",
    rate_limited: "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.",
    registration_failed: "Pendaftaran gagal. Silakan coba lagi.",
    password_too_long: "Kata sandi maksimal {max} karakter.",
    invalid_callback:
      "Tautan konfirmasi itu tidak lengkap. Buka tautan terbaru dari emailmu, atau masuk jika kamu sudah mengonfirmasi.",
    confirmation_failed:
      "Tautan konfirmasi itu sudah kedaluwarsa atau sudah dipakai. Coba masuk, atau daftar lagi untuk mendapat tautan baru.",
    unexpected: "Terjadi kesalahan. Silakan coba lagi.",
  },
};
