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
    newWords: "Cuvinte noi",
    duels: "Dueluri",
    review: "Recapitularea",
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

  hero: {
    titleLine1: "Învață cuvinte.",
    titleLine2: "Ține-le minte.",
    lead: "Alegi un set gata făcut, scrii propozițiile tale cu fiecare cuvânt, iar fiecare cuvânt revine exact înainte să-l uiți.",
    ctaStart: "Începe gratuit",
    ctaMethod: "Cum funcționează",
    facts: [
      "Seturi gata făcute",
      "Propozițiile tale",
      "Totul în română",
      "Start gratuit",
    ],
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
    rememberedTitle: "Ți-ai amintit?",
    rememberedText: "Urcă o cutie și revine mai târziu.",
    forgotTitle: "Ai uitat?",
    forgotText: "Înapoi în cutia 1, îl revezi mâine.",
  },

  review: {
    titleLine1: "O recapitulare",
    titleLine2: "durează minute.",
    lead: "Fiecare cuvânt revine doar când cutia lui spune că e momentul. Derulează opt zile cu trei cuvinte: câteva secunde pe zi, câteva minute în total.",
    points: [
      {
        title: "Doar ce e la rând",
        text: "În fiecare zi vezi doar cuvintele pentru care cutia spune că e momentul.",
      },
      {
        title: "O singură apăsare sinceră",
        text: "Știu sau am uitat. Cutia se ocupă de program.",
      },
      {
        title: "Seturi de cuvinte gata făcute",
        text: "Pornești de la seturi alese, fără să faci liste de mână.",
      },
    ],
    day: "Ziua {n}",
    thinking: "Îți amintești?",
    gotIt: "Știut",
    forgot: "Uitat",
    remembered: "{word}: știut, trece din cutia {from} în cutia {to}",
    forgotten: "{word}: uitat, se întoarce din cutia {from} în cutia {to}",
    nothingDue: "Azi nu ai nimic de repetat",
    nextUp: "Urmează: {words}, în ziua {n}",
    zeroMin: "0 min",
    calendarLabel: "Opt zile de recapitulări pentru trei cuvinte",
  },

  sentence: {
    titleLine1: "Apoi folosește-l",
    titleLine2: "într-o propoziție.",
    lead: "Să știi un cuvânt înseamnă să-l folosești. Scrie propoziția ta cu fiecare cuvânt, iar Elevo marchează greșelile și numește timpul folosit.",
    points: [
      {
        title: "Cuvintele tale, propozițiile tale",
        text: "Exersezi direct pe pagina cuvântului, de câte ori vrei.",
      },
      {
        title: "Greșeli marcate",
        text: "Gramatica și ortografia sunt verificate, cu o sugestie pentru fiecare greșeală.",
      },
      {
        title: "Timpul numit",
        text: "Vezi ce timp ai folosit sau alege unul pe care să-l exersezi.",
      },
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

  duel: {
    titleLine1: "Provoacă",
    titleLine2: "un prieten",
    lead: "Un duel de cuvinte în timp real: 10 cuvinte, câte 7 secunde. Vedeți amândoi același cuvânt în același moment și câștigă răspunsul corect și rapid.",
    points: [
      {
        title: "Față în față",
        text: "Același cuvânt, același cronometru, în același timp.",
      },
      {
        title: "Viteza contează",
        text: "Un răspuns corect aduce mai multe puncte cu cât e mai rapid. Ultima rundă valorează dublu.",
      },
      {
        title: "Doar cu prieteni",
        text: "Adaugă prieteni în aplicație și trimite o provocare când aveți amândoi un minut.",
      },
    ],
    round: "Runda {n} din {total}",
    timeLeft: "Timp rămas",
    pick: "Ce cuvânt englezesc este?",
    you: "tu",
    theyAnswered: "@{name} a răspuns",
  },

  triage: {
    titleLine1: "Cuvinte noi,",
    titleLine2: "sortate în secunde",
    lead: "Cuvintele vin din seturi gata făcute. Îl știi? Trage-l la stânga și nu te mai încurcă. E nou? Trage-l la dreapta și intră direct la repetare.",
    points: [
      {
        title: "Îl știi? Treci peste",
        text: "Cuvintele pe care le știi nu ajung la repetare.",
      },
      {
        title: "E nou? În cutia 1",
        text: "Pornește din prima cutie și intră în repetarea de azi.",
      },
      {
        title: "Câteva pe zi",
        text: "O limită zilnică de cuvinte noi ține repetarea scurtă.",
      },
    ],
    question: "Știi cuvântul ăsta?",
    know: "Știu",
    learn: "Învață",
    hint: "Derulează ca să sortezi teancul",
    known: "Știute: {n}",
    toLearn: "De învățat: {n}",
    falling: [
      { word: "repetare", box: 1, place: "lead" },
      { word: "știi", box: 1, place: "points.0.title" },
      { word: "zilnică", box: 1, place: "points.2.text", nudge: -0.12 },
      { word: "încurcă", box: 1, place: "lead", front: true, nudge: -0.06 },
      { word: "Cuvinte", box: 1, place: "title", nudge: -0.08 },
      { word: "sortate", box: 1, place: "title", nudge: -0.02 },
      {
        word: "scurtă",
        box: 2,
        place: "points.2.text",
        right: true,
        nudge: -0.07,
      },
      { word: "direct", box: 2, place: "lead", right: true, nudge: -0.07 },
      { word: "Derulează", box: 4, place: "hint", nudge: -0.12 },
      { word: "wonder", box: 4, place: "card" },
      { word: "cuvântul", box: 5, place: "question" },
      { word: "Știute", box: 0, place: "counter" },
      { word: "învățat", box: 0, place: "counter" },
    ],
  },

  cta: {
    titleLine1: "Primul tău set",
    titleStick: "e gata.",
    lead: "Alege un set, repetă câteva cuvinte, scrie o propoziție. Asta e practica unei zile.",
    reassure: "Fără card bancar. Ai sărit o zi? Cuvintele te așteaptă.",
    dashboard: "Mergi la panou",
    already: "Înveți deja?",
    logIn: "Intră",
    receipt: {
      rows: [
        { label: "5 cutii Leitner", value: "✓" },
        { label: "Seturi de cuvinte gata făcute", value: "✓" },
        { label: "Verificarea propozițiilor", value: "✓" },
        { label: "Dueluri cu prietenii", value: "✓" },
        { label: "Timp pe zi", value: "~5 min" },
      ],
      total: "Total la start",
      sum: "0,00",
      thanks: "Mulțumim! Revino mâine.",
      stamp: "Start gratuit",
    },
  },

  footer: {
    tagline: "Învață cuvinte. Ține-le minte.",
  },
};
