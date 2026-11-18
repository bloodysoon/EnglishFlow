import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { riseStyle } from "@/components/ui/rise";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { wordDifficulty, type Difficulty } from "@/features/learning/difficulty";
import type { HardWord } from "@/features/learning/queries";

// Hardest → box 1 coral, then box 2 yellow, then box 3 green.
const difficultyTone: Record<Difficulty, string> = { 3: "bg-box-1", 2: "bg-box-2", 1: "bg-box-3" };

// Stamp delays stop growing after this many rows, so a long list does not wait seconds.
const MAX_STAGGERED_ROWS = 8;

function DifficultyMeter({ level, label, row }: { level: Difficulty; label: string; row: number }) {
  return (
    <span role="img" aria-label={fill(label, { level })} className="flex shrink-0 gap-1">
      {[1, 2, 3].map((block) => (
        <span
          key={block}
          className={`h-3.5 w-3.5 border-[2px] border-line ${
            block <= level ? `stamp shadow-[2px_2px_0_var(--line)] ${difficultyTone[level]}` : "bg-canvas"
          }`}
          style={riseStyle(Math.min(row, MAX_STAGGERED_ROWS) * 2 + block)}
        />
      ))}
    </span>
  );
}

type Props = {
  words: HardWord[];
  locale: Locale;
  d: PlatformDictionary["dashboard"];
  // Rank of the first word, for pages after the first.
  start?: number;
};

export function HardWordList({ words, locale, d, start = 1 }: Props) {
  return (
    <ol start={start} className="divide-y-[3px] divide-line border-[3px] border-line bg-raised shadow-brutal">
      {words.map((word, i) => (
        <li key={word.wordId}>
          <Link
            href={`/learn/words/${word.wordId}`}
            className="group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas focus-visible:bg-canvas sm:gap-4 sm:px-5"
          >
            <span className="font-display w-7 shrink-0 text-xl font-black text-muted">{start + i}</span>
            <span className="min-w-0 flex-1">
              <span lang="en" className="block truncate text-lg font-black">
                {word.lemma}
              </span>
              <span className="block text-xs font-bold text-muted">{plural(locale, word.forgot, d.forgotTimes)}</span>
            </span>
            <DifficultyMeter level={wordDifficulty(word.forgot, word.reviews)} label={d.difficulty} row={i} />
            <span
              className={`hidden shrink-0 border-[2px] border-line px-2 py-1 text-xs font-black uppercase min-[400px]:inline ${leitnerBoxStyles[word.box]}`}
            >
              {fill(d.box, { box: word.box })}
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ol>
  );
}
