import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { fill, type Locale } from "@/features/i18n/locales";
import { getLandingDictionary } from "@/features/i18n/landing";
import { HERO_WORD } from "@/features/i18n/landing/words";

// Link preview: the hero in miniature, in the page's language. Each
// language's opengraph-image.tsx renders it once at build time; child
// routes (login, register) inherit their language's image.
export const ogSize = { width: 1200, height: 630 };

// Unbounded 900 (OFL, Google Fonts), subset to Latin with Romanian
// diacritics, Cyrillic, digits and punctuation: next/og cannot read the
// woff2 that next/font ships. Characters outside it fall back to another font.
const display = await readFile(join(process.cwd(), "src/app/_og/unbounded-900.ttf"));

// The light theme from globals.css: an image cannot read CSS variables.
const C = {
  canvas: "#f3eee4",
  raised: "#fffdf8",
  fg: "#22201c",
  muted: "#5e574d",
  chip: "#a9cbb0",
  mark: "#e9937a",
  boxes: ["#ee9f86", "#f0c872", "#a9cbb0", "#93c3cf", "#2f3b4c"],
};

const border = `5px solid ${C.fg}`;
const shadow = (px: number) => `${px}px ${px}px 0 ${C.fg}`;
// Satori has no `inset`, so each card in the deck gets explicit geometry.
const cardBox = { position: "absolute", top: 0, left: 0, width: 400, height: 250, border } as const;

export function ogAlt(locale: Locale) {
  return getLandingDictionary(locale).meta.title;
}

export function renderOgImage(locale: Locale) {
  const { hero, card } = getLandingDictionary(locale);
  const upper = (text: string) => text.toLocaleUpperCase(locale);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          background: C.canvas,
          color: C.fg,
          fontFamily: "Unbounded",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40 }}>
            ELEVO
            <div style={{ width: 22, height: 22, background: C.mark, border: `4px solid ${C.fg}` }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 22 }}>
            {/* One line in every language: Unbounded's comma under Romanian Ț
                reaches deep enough to hit a wrapped second line. */}
            <div style={{ fontSize: 50, lineHeight: 1.1, whiteSpace: "nowrap" }}>{upper(hero.titleLine1)}</div>
            <div
              style={{
                fontSize: 36,
                padding: "12px 22px",
                background: C.raised,
                border,
                boxShadow: shadow(8),
                transform: "rotate(-2deg)",
              }}
            >
              {upper(hero.titleLine2)}
            </div>
          </div>

          {/* Each fact stays whole; only whole facts move to the next line. */}
          <div style={{ display: "flex", flexWrap: "wrap", columnGap: 22, rowGap: 8, fontSize: 20, color: C.muted }}>
            {hero.facts.map((fact) => (
              <div key={fact} style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                <div style={{ width: 12, height: 12, background: C.mark, border: `3px solid ${C.fg}` }} />
                {upper(fact)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 54 }}>
          <div style={{ display: "flex", position: "relative", width: 400, height: 250 }}>
            <div style={{ ...cardBox, background: C.boxes[3], transform: "rotate(-7deg)" }} />
            <div style={{ ...cardBox, background: C.boxes[1], transform: "rotate(5deg)" }} />
            <div
              style={{
                ...cardBox,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 26,
                background: C.raised,
                boxShadow: shadow(10),
                transform: "rotate(-2deg)",
              }}
            >
              <div style={{ display: "flex", fontSize: 18, padding: "4px 10px", background: C.boxes[1], border: `3px solid ${C.fg}`, alignSelf: "flex-start" }}>
                {upper(fill(card.box, { box: 2 }))}
              </div>
              <div style={{ fontSize: 56 }}>{HERO_WORD.word}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            {C.boxes.map((color, i) => (
              <div
                key={color}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 62,
                  height: 62,
                  fontSize: 28,
                  background: color,
                  color: i === 4 ? C.canvas : C.fg,
                  border,
                  boxShadow: shadow(5),
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Unbounded", data: display, weight: 900, style: "normal" }] },
  );
}
