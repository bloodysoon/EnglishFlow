import type { LandingDictionary } from "./types";

export const id: LandingDictionary = {
  meta: {
    title: "Elevo · Pelajari kata. Ingat selamanya.",
    description:
      "Pelajari kata bahasa Inggris dari set yang sudah siap, pakai setiap kata dalam kalimatmu sendiri, dan ulangi tepat sebelum kamu lupa. Gratis untuk memulai.",
  },

  translationLanguages: ["id"],

  nav: {
    label: "Utama",
    home: "Beranda Elevo",
    method: "Metodenya",
    review: "Coba mengulang",
    sentences: "Kalimat",
    start: "Mulai",
    logIn: "Masuk",
    dashboard: "Dasbor",
    openDashboardFor: "Buka dasbor untuk {email}",
    language: "Bahasa",
    themeLabel: "Tema gelap",
    themeToLight: "Ganti ke tema terang",
    themeToDark: "Ganti ke tema gelap",
  },

  pauseMotion: "Jeda animasi",

  scroll: {
    toMethod: "Lihat metodenya",
    toReview: "Coba mengulang",
    toSentences: "Lalu pakai",
    toStart: "Siap mulai?",
    toTop: "Kembali ke atas",
  },

  hero: {
    titleLine1: "Pelajari kata.",
    titleLine2: "Ingat selamanya.",
    lead: "Pilih set kata yang sudah siap, tulis kalimatmu sendiri dengan setiap kata, dan setiap kata kembali tepat sebelum kamu melupakannya.",
    ctaStart: "Mulai belajar gratis",
    ctaContinue: "Lanjutkan belajar",
    ctaMethod: "Lihat metodenya",
    already: "Sudah belajar?",
    logIn: "Masuk",
    facts: ["Set siap pakai", "Kalimatmu sendiri", "Terjemahan RU & RO", "Gratis untuk memulai"],
  },

  card: {
    box: "Kotak {box}",
    dueToday: "Jadwal hari ini",
    question: "Kamu tahu terjemahannya?",
    translation: "Terjemahan",
    gotIt: "Ingat",
    nextReview: "Ulangan berikutnya 3 hari lagi",
    xp: "+25 XP",
  },

  how: {
    titleLine1: "Lima kotak.",
    titleLine2: "Satu aturan.",
    lead: "Setiap kata tinggal di salah satu dari lima kotak. Makin kamu kenal, makin jauh kata itu berpindah dan makin jarang kamu melihatnya. Waktumu dipakai untuk kata yang hampir kamu lupa.",
    box: "Kotak",
    boxOf: "dari {total}",
    boxLabels: {
      1: "Kata baru",
      2: "Mulai ingat",
      3: "Mulai melekat",
      4: "Hampir hafal",
      5: "Dikuasai",
    },
    review: "Ulangi {interval}",
    progressNew: "Baru",
    progressMastered: "Dikuasai",
    rememberedTitle: "Ingat?",
    rememberedText: "Kata naik satu kotak dan kembali nanti.",
    forgotTitle: "Lupa?",
    forgotText: "Kembali ke Kotak 1, jadi kamu melihatnya lagi besok.",
  },

  review: {
    titleLine1: "Mengulang hanya",
    titleLine2: "beberapa menit.",
    lead: "Balik kartunya, jujurlah, dan lihat setiap kata pindah ke kotaknya. Beberapa menit sehari sudah cukup.",
    points: [
      { title: "Hanya yang terjadwal", text: "Setiap hari hanya muncul kata yang kotaknya bilang sudah waktunya." },
      { title: "Satu ketukan jujur", text: "Ingat atau lupa. Kotak yang mengatur jadwalnya untukmu." },
      { title: "Set kata siap pakai", text: "Mulai dari set pilihan, tanpa menyusun daftar sendiri." },
    ],
    wordOf: "Kata {current} dari {total}",
    done: "Selesai",
    doneTitle: "Ulangan selesai ✓",
    summary: "Naik: {up}. Kembali ke Kotak 1: {back}. Di aplikasi, setiap kata kembali sesuai jadwalnya sendiri.",
    showTranslation: "Tampilkan terjemahan",
    forgot: "Lupa",
    gotIt: "Ingat",
    tryAgain: "Coba lagi",
    signUp: "Daftar",
    yourWords: "Kata-katamu",
    perBox: "Kata per kotak",
    wordCount: "kata: {count}",
    liveMoved: "{word} sekarang ada di Kotak {box}.",
    liveBack: "{word} kembali ke Kotak 1.",
  },

  sentence: {
    titleLine1: "Lalu pakai",
    titleLine2: "dalam kalimat.",
    lead: "Tahu sebuah kata berarti bisa memakainya. Tulis kalimatmu sendiri dengan setiap kata, dan Elevo menandai kesalahan serta menyebut tenses yang kamu pakai.",
    points: [
      { title: "Katamu, kalimatmu", text: "Berlatih langsung di halaman kata, sesering yang kamu mau." },
      { title: "Kesalahan ditandai", text: "Tata bahasa dan ejaan diperiksa, dengan saran untuk setiap kesalahan." },
      { title: "Tenses disebutkan", text: "Lihat tenses yang kamu pakai, atau pilih satu untuk dilatih." },
    ],
    prompt: "Tulis kalimat dengan kata ini",
    firstTry: "Percobaan pertama",
    before: "Yesterday I ",
    mistake: "borrow",
    after: " my sister's bike.",
    hint: "“Yesterday” menunjukkan masa lalu: coba “borrowed”.",
    secondTry: "Percobaan kedua",
    fixed: "Yesterday I borrowed my sister's bike.",
    fixedWord: "borrowed",
    noMistakes: "Tanpa kesalahan",
    tense: "Past Simple",
  },

  cta: {
    titleLine1: "Set kata pertamamu",
    titleStick: "sudah siap.",
    lead: "Pilih set, ulangi beberapa kata, tulis satu kalimat. Itu latihan sehari.",
    create: "Buat akun gratis",
    dashboard: "Ke dasbor",
    already: "Sudah belajar?",
    logIn: "Masuk",
    stickers: ["Gratis untuk memulai", "Tanpa menyusun dek", "5 menit sehari", "EN · RU · RO"],
  },

  footer: {
    tagline: "Pelajari kata. Ingat selamanya.",
    signUp: "Daftar",
  },
};
