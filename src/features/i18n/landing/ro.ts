import type { LandingDictionary } from "./types";

export const ro: LandingDictionary = {
  meta: {
    title: "Elevo · Învață cuvinte. Ține-le minte.",
    description:
      "Învață cuvinte englezești din seturi gata făcute, folosește-le în propozițiile tale și repetă fiecare cuvânt exact înainte să-l uiți. Totul în română. Începi gratuit.",
  },

  translationLanguages: ["ro"],

  nav: {
    label: "Meniu principal",
    home: "Elevo — pagina principală",
    method: "Metoda",
    review: "Încearcă",
    sentences: "Propoziții",
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
    toSentences: "Apoi folosește-l",
    toStart: "Gata să începi?",
    toTop: "Sus",
  },

  hero: {
    titleLine1: "Învață cuvinte.",
    titleLine2: "Ține-le minte.",
    lead: "Alegi un set gata făcut, scrii propozițiile tale cu fiecare cuvânt, iar fiecare cuvânt revine exact înainte să-l uiți.",
    ctaStart: "Începe gratuit",
    ctaContinue: "Continuă",
    ctaMethod: "Cum funcționează",
    already: "Înveți deja?",
    logIn: "Intră",
    facts: ["Seturi gata făcute", "Propozițiile tale", "Totul în română", "Start gratuit"],
  },

  card: {
    box: "Cutia {box}",
    dueToday: "Pentru azi",
    question: "Știi traducerea?",
    translation: "Traducere",
    gotIt: "Știu",
    nextReview: "Recapitulare în 3 zile",
    xp: "+25 XP",
  },

  how: {
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
    titleLine1: "O recapitulare",
    titleLine2: "durează minute.",
    lead: "Întoarce cartonașul, fii sincer și privește cum fiecare cuvânt se mută în cutia lui. Câteva minute pe zi sunt de ajuns.",
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

  sentence: {
    titleLine1: "Apoi folosește-l",
    titleLine2: "într-o propoziție.",
    lead: "Să știi un cuvânt înseamnă să-l folosești. Scrie propoziția ta cu fiecare cuvânt, iar Elevo marchează greșelile și numește timpul folosit.",
    points: [
      { title: "Cuvintele tale, propozițiile tale", text: "Exersezi direct pe pagina cuvântului, de câte ori vrei." },
      { title: "Greșeli marcate", text: "Gramatica și ortografia sunt verificate, cu o sugestie pentru fiecare greșeală." },
      { title: "Timpul numit", text: "Vezi ce timp ai folosit sau alege unul pe care să-l exersezi." },
    ],
    prompt: "Scrie o propoziție cu acest cuvânt",
    firstTry: "Prima încercare",
    before: "Yesterday I ",
    mistake: "borrow",
    after: " my sister's bike.",
    hint: "„Yesterday” e la trecut: încearcă „borrowed”.",
    secondTry: "A doua încercare",
    fixed: "Yesterday I borrowed my sister's bike.",
    fixedWord: "borrowed",
    noMistakes: "Fără greșeli",
    tense: "Past Simple",
  },

  cta: {
    titleLine1: "Primul tău set",
    titleStick: "e gata.",
    lead: "Alege un set, repetă câteva cuvinte, scrie o propoziție. Asta e practica unei zile.",
    create: "Creează un cont gratuit",
    dashboard: "Mergi la panou",
    already: "Înveți deja?",
    logIn: "Intră",
    stickers: ["Start gratuit", "Fără liste de făcut", "5 minute pe zi", "Totul în română"],
  },

  footer: {
    tagline: "Învață cuvinte. Ține-le minte.",
    signUp: "Înregistrare",
  },
};
