# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Non-native English speakers anywhere in the world who want to build English vocabulary as a short daily habit. Russian and Romanian speakers are served first (interface and translations in EN, RU, RO); more native languages are planned. Learners range across CEFR levels and typically practise a few minutes a day, often on a phone.

## Product Purpose

Elevo helps learners remember English words for good. Words come back on a spaced-repetition schedule right before they would be forgotten, and learners use them in their own sentences. Success means words reach the last Leitner box and the learner keeps a steady daily habit without burning out.

The name is deliberately broad ("elevate"): Elevo is a growing English-learning platform, not only a flashcard or Leitner tool. More learning features will follow.

## Positioning

- **No setup.** Words come from curated, ready-made sets by CEFR level and topic. Unlike Anki, nobody builds their own decks.
- **Words used in context.** Learners write their own sentences with each word and get grammar and tense feedback, instead of only flipping cards.
- **Calm, no guilt.** Streaks, XP and achievements reward consistency without Duolingo-style pressure, nagging or loss-aversion tricks.
- **Native-language first.** Interface and translations in the learner's own language, starting with Russian and Romanian.

## Operating Context

- Daily review sessions: the due words from the 5 Leitner boxes (intervals 1 / 3 / 7 / 14 / 30 days; remembered moves up a box, forgotten goes back to Box 1).
- Learning flow: pick words from sets, triage known/unknown, quiz, review, write sentences per word.
- Progress surfaces: dashboard, statistics, achievements with XP, day-by-day timeline.
- Settings: daily goal, translation language, theme (light/dark/system), password.
- Admin: word-set editing and publishing, XP rules, app defaults, user list.

## Capabilities and Constraints

- Next.js App Router on Vercel, Supabase Auth + Postgres with RLS, Zod validation on the server.
- Locales: `en`, `ru`, `ro` (routes `/`, `/ru`, `/ro`); translation languages for words: `ru`, `ro`.
- Sentence checking uses the LanguageTool API (rate-limited quota, signed-in learners only).
- Word data and CEFR levels come from open dictionary sources (credits shown in the app).
- Learners can also add a custom word, but the product promise is curated sets; do not market "build your own lists".
- Planned: a paid tier ("Free to start" stays true). Pricing and plan contents are undecided.
- Undecided: which native languages come after RU/RO.

## Brand Commitments

- Name: **Elevo** (formerly EnglishFlow), wordmark "ELEVO✳". Domains and trademarks not yet checked.
- Tagline in use: "Learn words. Remember forever."
- Voice: plain, encouraging, calm; short sentences; no pressure or guilt.
- Streak, XP and level-up stickers are intentional parts of the product, kept on purpose.

## Evidence on Hand

None yet: pre-launch. Never invent testimonials, user counts, ratings, learning-outcome statistics or press mentions. Factual claims allowed: the 5-box method and its intervals, curated sets, sentence checking, EN/RU/RO support, free to start.

## Product Principles

1. **Memory over volume.** Time goes to words the learner is about to forget, not to showing more words.
2. **Zero setup.** A learner reaches their first review in minutes, with nothing to build or configure.
3. **Use beats recognition.** Knowing a word means using it in a sentence, not just recognising it on a card.
4. **Calm consistency.** Reward showing up; never shame missing a day.
5. **Speak the learner's language.** Every screen works fully in the learner's native language.

## Accessibility & Inclusion

Must work from 320px phones upward with comfortable touch targets, keyboard navigation and visible focus. Accessible contrast in both light and dark themes. Respect reduced-motion preferences (the landing has a pause-animations control). All copy must be translatable (EN/RU/RO and future languages).
