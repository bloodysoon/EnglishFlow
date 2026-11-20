import type { LandingLanguage, LandingWord } from "@/features/i18n/landing/words";

type WordTranslationProps = {
  word: LandingWord;
  languages: LandingLanguage[];
  className?: string;
};

// A word's translation(s). One language: just the translation. Several
// (the English page shows RU and RO): each one tagged with its language.
export function WordTranslation({ word, languages, className = "" }: WordTranslationProps) {
  if (languages.length === 1) {
    const [only] = languages;
    return (
      <span lang={only} className={className}>
        {word.translations[only]}
      </span>
    );
  }

  return (
    <span className={`flex flex-col gap-1 ${className}`}>
      {languages.map((language) => (
        <span key={language} lang={language} className="flex items-baseline gap-2">
          <span className="text-[max(0.55em,0.5625rem)] font-black tracking-widest uppercase">
            {language}
          </span>
          {word.translations[language]}
        </span>
      ))}
    </span>
  );
}
