import type { LandingDictionary } from "./types";

export const ro: LandingDictionary = {
  meta: {
    title: "Elevo · Învață cuvinte. Ține-le minte.",
    description:
      "Învață vocabular englezesc prin repetare spațiată și sistemul Leitner. Exersează puțin în fiecare zi.",
  },

  translationLanguages: ["ro"],

  nav: {
    label: "Meniu principal",
    home: "Elevo — pagina principală",
    method: "Metoda",
    review: "Încearcă",
    start: "Începe",
    logIn: "Intră",
    dashboard: "Panou",
    openDashboardFor: "Deschide panoul pentru {email}",
    language: "Limba",
    themeLabel: "Temă întunecată",
    themeToLight: "Activează tema luminoasă",
    themeToDark: "Activează tema întunecată",
  },

  pauseMotion: "Oprește animațiile",

  scroll: {
    toMethod: "Cum funcționează",
    toReview: "Încearcă singur",
    toStart: "Gata să începi?",
    toTop: "Sus",
  },

  hero: {
    sticker: "Cartonașe care știu când vei uita",
    titleLine1: "Învață cuvinte.",
    titleLine2: "Ține-le minte.",
    lead: "Învață vocabular englezesc prin repetare spațiată: fiecare cuvânt revine exact înainte să-l uiți.",
    leadHighlight: "Exersează puțin. Reține mult.",
    ctaStart: "Începe gratuit",
    ctaContinue: "Continuă",
    ctaMethod: "Cum funcționează",
    facts: ["5 cutii", "1 regulă simplă", "Câteva minute pe zi"],
  },

  card: {
    box: "Cutia {box}",
    dueToday: "Pentru azi",
    question: "Știi traducerea?",
    translation: "Traducere",
    gotIt: "Știu",
    streak: "7 zile la rând",
    xp: "+25 XP",
  },

  how: {
    eyebrow: "Metoda Leitner",
    titleLine1: "Cinci cutii.",
    titleLine2: "O regulă.",
    lead: "Fiecare cuvânt stă într-una din cinci cutii. Cu cât îl știi mai bine, cu atât avansează și îl vezi mai rar. Timpul tău merge spre cuvintele pe care ești pe cale să le uiți.",
    box: "Cutia",
    boxOf: "din {total}",
    boxLabels: {
      1: "Cuvinte noi",
      2: "Pe drum",
      3: "Se fixează",
      4: "Aproape ale tale",
      5: "Învățate",
    },
    review: "Recapitulare {interval}",
    progressNew: "Nou",
    progressMastered: "Învățat",
    rememberedTitle: "Ți-ai amintit?",
    rememberedText: "Urcă o cutie și revine mai târziu.",
    forgotTitle: "Ai uitat?",
    forgotText: "Înapoi în cutia 1, îl revezi mâine.",
  },

  review: {
    eyebrow: "Încearcă aici",
    titleLine1: "O recapitulare",
    titleLine2: "durează minute.",
    lead: "Întoarce cartonașul, fii sincer și privește cum fiecare cuvânt se mută în cutia lui. Asta e toată rutina zilnică.",
    points: [
      { title: "Doar ce e la rând", text: "În fiecare zi vezi doar cuvintele pentru care cutia spune că e momentul." },
      { title: "O singură apăsare sinceră", text: "Știu sau am uitat. Cutia se ocupă de program." },
      { title: "Seturi de cuvinte gata făcute", text: "Pornești de la seturi alese, fără să faci liste de mână." },
    ],
    wordOf: "Cuvântul {current} din {total}",
    done: "Gata",
    doneTitle: "Recapitulare gata ✓",
    summary: "Au urcat: {up}. Înapoi în cutia 1: {back}. În aplicație, fiecare cuvânt revine după propriul program.",
    showTranslation: "Arată traducerea",
    forgot: "Am uitat",
    gotIt: "Știu",
    tryAgain: "Încă o dată",
    signUp: "Înregistrare",
    yourWords: "Cuvintele mele",
    perBox: "Cuvinte pe cutii",
    wordCount: "cuvinte: {count}",
    liveMoved: "{word}: acum în cutia {box}.",
    liveBack: "{word}: înapoi în cutia 1.",
  },

  cta: {
    sticker: "Următorul capitol începe aici ✳",
    titleLine1: "Gata ca engleza ta",
    titleStick: "să rămână?",
    lead: "Câteva minute pe zi fac o mare diferență. Drumul începe cu un singur cuvânt.",
    create: "Creează un cont gratuit",
    dashboard: "Mergi la panou",
    already: "Înveți deja?",
    logIn: "Intră",
    stickers: ["Poți ⚡", "Hai ✳", "Progres mare ✓", "Începe azi ↗"],
  },

  footer: {
    tagline: "Ca engleza să rămână.",
    signUp: "Înregistrare",
  },
};
