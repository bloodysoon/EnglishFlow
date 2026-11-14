// Required credits for the word data (CC BY-SA and CEFR-J terms): keep visible, keep small.
export function DataCredits() {
  const link = "underline underline-offset-2 hover:decoration-mark";
  return (
    <p className="text-[0.7rem] leading-snug font-semibold text-muted">
      Data:{" "}
      <a className={link} href="https://www.wiktionary.org/" target="_blank" rel="noreferrer">
        Wiktionary
      </a>
      {" · "}CEFR-J Wordlist (Tono Lab, TUFS){" · "}Octanove C1/C2, via{" "}
      <a className={link} href="https://github.com/openlanguageprofiles/olp-en-cefrj" target="_blank" rel="noreferrer">
        Open Language Profiles
      </a>
      {" · "}
      <a className={link} href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
        CC BY-SA 4.0
      </a>
    </p>
  );
}
