"use client";

import { useEffect, useRef } from "react";

const LAND_AT = 0.6; // a card lands when its box has come up to this share of the screen
const MIN_FLIGHT = 240; // and at least this many px of scroll
const RELEASE_GAP = 90; // px of scroll between one card letting go and the next
const OPEN_AHEAD = 220; // px of scroll before its card lands that a box starts opening
const TIP = 0.2; // share of a fall spent tipping on its edge before it slips off
const MIN_DROP = 140; // a word lands at least this far below where it let go (px)
const SMOOTHING = 0.2;

type Flight = {
  source: HTMLElement;
  clone: HTMLElement;
  cx: number; // its centre in the page when it lets go (px)
  cy: number;
  width: number; // its own size, before any shrinking
  height: number;
  release: number; // scroll where it lets go
  land: number; // scroll where it is in its box
  slot: HTMLElement; // the small card it lands as
  rest: number; // that card's tilt, which it turns to as it lands
  box: number; // index of the box that catches it
  y0: number; // its centre on screen as it lets go
  slotX: number; // its card's centre on screen (px; it doesn't move sideways)
  landY: number; // its card's top on screen at the moment it lands
  end: number; // the size it shrinks to: its card's width over its own
  tip: number; // how far it leans over its edge before it slips off (deg, signed: the side it falls to)
  spin: number; // how much further it turns while falling (deg)
  landed?: boolean;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Overshoots past 1 and settles back (easeOutBack).
const backOut = (v: number) =>
  1 + 2.70158 * (v - 1) ** 3 + 1.70158 * (v - 1) ** 2;
const easeInOut = (v: number) =>
  v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;

// Where an element will be in the page once its section's sticky pin lets
// go (data-pin inside data-pin-track, or a ScrollScene), and the scroll at
// which that happens; an element in no pin is simply where it is now.
function settled(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const pin = el.closest<HTMLElement>("[data-pin], .scene-pin");
  const track = pin?.parentElement;
  if (!pin || !track || getComputedStyle(pin).position !== "sticky") {
    return { top: rect.top + scrollY, free: -Infinity };
  }
  const range = track.offsetHeight - pin.offsetHeight;
  const trackTop = track.getBoundingClientRect().top + scrollY;
  const stick = parseFloat(getComputedStyle(pin).top) || 0;
  return {
    top: trackTop + range + (rect.top - pin.getBoundingClientRect().top),
    free: trackTop + range - stick,
  };
}

// The cards of the New words deck (data-fall-source), once the deck is
// done and its section moves on, are dealt into the Leitner boxes of "How it
// works" (data-fall-box) coming up below: the front card first, then the
// one behind it, and so on. Each falls whole, shrinking on the way, and
// lands as that box's small card (copied from its data-fall-slot). One card
// per box: the box right under the deck first, then its neighbours (on
// phones, where the boxes stand in a column, top to bottom). A box opens
// just before its card comes. It all follows the scroll, so scrolling back
// up puts every card back. Without JS or with reduced motion the boxes show
// their static cards.
export function FallingWords() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    let flights: Flight[] = [];
    let lids: {
      scene: HTMLElement;
      crate: HTMLElement;
      count: HTMLElement | null;
      open: number;
      box: number;
    }[] = [];
    let smooth = scrollY;
    let frame = 0;
    let built = false;

    // Until the first scroll the boxes wait shut and empty.
    document
      .querySelectorAll<HTMLElement>("[data-fall-slot]")
      .forEach((slot) => (slot.style.visibility = "hidden"));
    document
      .querySelectorAll<HTMLElement>("[data-fall-box] .crate-scene")
      .forEach((scene) => scene.style.setProperty("--lid", "0"));

    function teardown() {
      flights.forEach((f) => {
        f.source.style.opacity = "";
        f.clone.remove();
        f.slot.remove(); // the card it would land as
      });
      flights = [];
    }

    function build() {
      teardown();
      const vh = innerHeight;

      const boxes = [
        ...document.querySelectorAll<HTMLElement>("[data-fall-box]"),
      ].map((el) => {
        const scene = el.querySelector<HTMLElement>(".crate-scene") ?? el;
        const rect = scene.getBoundingClientRect();
        // Where the box sits in the page before any pinning.
        const track = el.closest<HTMLElement>(".scene-track");
        const pin = el.closest<HTMLElement>(".scene-pin");
        const offset =
          track && pin
            ? track.getBoundingClientRect().top -
              pin.getBoundingClientRect().top
            : 0;
        return {
          scene,
          crate: el.querySelector<HTMLElement>(".crate") ?? el,
          count: el.querySelector<HTMLElement>("[data-fall-count]"),
          left: rect.left,
          right: rect.right,
          top: rect.top + offset + scrollY, // its open top
          offset, // from where the box is now to where it sits before any pinning
          // A static card to copy for the card that lands here.
          template: el.querySelector<HTMLElement>("[data-fall-slot]"),
          used: 0,
          firstLand: Infinity,
        };
      });
      if (!boxes.length) return;
      // Boxes in one column (phones) rather than a row.
      const stacked =
        boxes.length > 1 && Math.abs(boxes[0].left - boxes[1].left) < 8;

      // The words that fall: from lg those with a box (data-fall-target),
      // on phones those marked for phones; each once, top to bottom.
      const seen = new Set<string>();
      const sources = [
        ...document.querySelectorAll<HTMLElement>("[data-fall-source]"),
      ]
        .filter((el) =>
          stacked
            ? el.dataset.fallPhones !== undefined
            : Number(el.dataset.fallTarget) > 0,
        )
        .map((el) => ({
          el,
          rect: el.getBoundingClientRect(),
          word: el.dataset.fallSource ?? "",
        }))
        .filter(({ el, rect, word }) => {
          // Same word bound for another box (Indonesian "Kata"/"kata") still falls.
          const key = `${word.toLowerCase()}:${el.dataset.fallTarget}`;
          if (
            rect.width === 0 ||
            rect.right < 0 ||
            rect.left > innerWidth ||
            seen.has(key)
          )
            return false;
          seen.add(key);
          return true;
        })
        .map((s) => ({ ...s, top: settled(s.el) }))
        .sort((a, b) => a.top.top - b.top.top || a.rect.left - b.rect.left);

      // Its box: the one named for it from lg; on phones, where the boxes
      // stand in a column, the next one down.
      const placed = sources.map((s, j) => ({
        ...s,
        box: stacked ? boxes[j] : boxes[Number(s.el.dataset.fallTarget) - 1],
      }));
      // Left to right in a box: the dictionary's order (data-fall-at) from lg;
      // on phones each box gets one card.
      const inBox = (b: (typeof placed)[number]["box"]) =>
        placed
          .filter((p) => p.box === b)
          .sort(
            (x, y) => Number(x.el.dataset.fallAt) - Number(y.el.dataset.fallAt),
          );

      // When the pinned section lets go: the moment the words start to fall.
      const frees = placed.map((p) => p.top.free).filter(Number.isFinite);
      const deckFree = frees.length ? Math.max(...frees) : -Infinity;

      flights = placed.flatMap(
        ({ el, rect, word, top: { top, free }, box }, j): Flight[] => {
          if (!box?.template) return [];
          const k = box.used++; // its place among the box's cards
          const row = inBox(box);
          const n = row.length;
          const pos = row.findIndex((p) => p.el === el); // left to right
          const right = row.some((p) => p.el.dataset.fallRight !== undefined);
          const width = el.offsetWidth;
          const height = el.offsetHeight;
          const cx = rect.left + rect.width / 2;
          const cy = top + rect.height / 2;

          // The flying copy: the word as it looks on the page.
          const clone = el.cloneNode(true) as HTMLElement;
          const style = getComputedStyle(el);
          clone.removeAttribute("data-fall-source");
          Object.assign(clone.style, {
            position: "absolute",
            left: "0",
            top: "0",
            margin: "0",
            width: `${width}px`,
            height: `${height}px`,
            font: style.font,
            color: style.color,
            letterSpacing: style.letterSpacing,
            textTransform: style.textTransform,
            whiteSpace: "nowrap",
            visibility: "hidden",
            transformOrigin: "50% 50%",
            willChange: "transform",
          });
          layer!.appendChild(clone);

          // The small card it becomes; a box's cards spread side by side.
          const card = box.template.cloneNode(true) as HTMLElement;
          card.removeAttribute("data-fall-slot");
          card.classList.remove("invisible");
          const text = card.querySelector<HTMLElement>("[data-fall-text]");
          if (text) text.textContent = word;
          // A random-looking but steady tilt, push and tumble for each word.
          const r1 = Math.sin(j * 12.9898) * 43758.5453;
          const rand = r1 - Math.floor(r1); // 0..1
          const rest = (rand - 0.5) * 14;
          Object.assign(card.style, {
            visibility: "hidden",
            right: "auto",
            rotate: `${rest}deg`,
            // A full box (over 3) stands in two rows, so every label shows:
            // every other card high at the back, the rest low in front.
            ...(n > 3
              ? {
                  paddingBottom: `${pos % 2 ? 22 : 64}px`,
                  zIndex: String(
                    (el.dataset.fallFront !== undefined ? 50 : 0) +
                      (pos % 2 ? 10 + pos : pos),
                  ),
                }
              : {
                  paddingBottom: `${Math.max(20, (stacked ? 36 : 60) - pos * 10)}px`,
                  zIndex: String(pos),
                }),
          });
          box.template.parentElement!.appendChild(card);
          const boxWidth = box.right - box.left;
          const nudge = Number(el.dataset.fallNudge ?? 0) * boxWidth;
          let left: number;
          if (right) {
            // Packed right, each card covers half of the one before it:
            // measure the cards from here to the right end by their words.
            const widthOf = (w: string) => {
              if (text) text.textContent = w;
              return card.offsetWidth;
            };
            const widths = row.slice(pos).map((p) => widthOf(p.word));
            if (text) text.textContent = word;
            left =
              boxWidth -
              12 -
              widths[widths.length - 1] -
              widths.slice(0, -1).reduce((sum, w) => sum + w / 2, 0);
          } else {
            const spread = Math.min(
              60,
              (boxWidth - card.offsetWidth) / Math.max(1, n - 1),
            );
            left =
              (boxWidth - card.offsetWidth) / 2 + (pos - (n - 1) / 2) * spread;
          }
          card.style.left = `${nudge + left}px`;

          // Where its card stands in the page (before any pinning).
          const slotRect = card.getBoundingClientRect();
          const slotTop = slotRect.top + box.offset + scrollY;

          // It lets go as soon as its section moves on (words below the
          // pin: as soon as they are on screen after that), a box's words
          // one after another. It lands when its card has come up to a
          // point well below where it let go (and at most a set height on
          // screen), so the whole fall is downward, onto a spot known in
          // advance.
          const release =
            (Number.isFinite(free)
              ? free
              : Math.max(deckFree, top - vh * 0.85)) +
            k * RELEASE_GAP +
            j * 12;
          const y0 = cy - release;
          const landAt = Math.min(
            vh - 80,
            Math.max(vh * LAND_AT, y0 + MIN_DROP),
          );
          const land = Math.max(slotTop - landAt, release + MIN_FLIGHT);
          box.firstLand = Math.min(box.firstLand, land);

          return [
            {
              source: el,
              clone,
              cx,
              cy,
              width,
              height,
              release,
              land,
              slot: card,
              rest,
              box: boxes.indexOf(box),
              y0,
              slotX: slotRect.left + slotRect.width / 2,
              landY: slotTop - land,
              end: slotRect.width / width,
              tip: (rand < 0.5 ? -1 : 1) * (12 + rand * 10),
              spin: 10 + rand * 15,
            },
          ];
        },
      );

      lids = boxes.map(({ scene, crate, count, firstLand }, box) => ({
        scene,
        crate,
        count,
        open: firstLand - OPEN_AHEAD,
        box,
      }));
    }

    function draw(s: number) {
      lids.forEach(({ scene, count, open, box }) => {
        // Flaps swing open a touch too far and settle back.
        scene.style.setProperty(
          "--lid",
          String(backOut(clamp01((s - open) / 160))),
        );
        if (count) {
          const n = flights.filter((f) => f.box === box && s >= f.land).length;
          count.textContent = String(n);
          count.style.visibility = n ? "visible" : "hidden";
        }
      });

      flights.forEach((f) => {
        const { clone, source, slot } = f;
        // The card leaves the deck as its copy takes off.
        source.style.opacity = s >= f.release ? "0" : "";
        slot.style.visibility = s >= f.land ? "" : "hidden";
        // Scrolling forward past the landing plays the impact once.
        if (s >= f.land && !f.landed) impact(f);
        f.landed = s >= f.land;
        if (s < f.release || s >= f.land) {
          clone.style.visibility = "hidden";
          return;
        }

        const u = (s - f.release) / (f.land - f.release);

        // It leans on its edge, loses support and drops. First it tips about
        // its bottom corner on the side that stays on the edge (that corner
        // stays put where it let go), so the free side goes down and the
        // word only ever moves down. Then it slips off and falls freely:
        // from rest, faster and faster (distance grows with v squared,
        // gravity), straight onto its card's landing spot, worked out in
        // advance, so nothing moves up or overshoots. While falling it
        // turns a little further, shrinks to its card's size, and settles to
        // the card's tilt just before it lands.
        const side = Math.sign(f.tip);
        const lean = Math.abs(f.tip);
        const rad = (deg: number) => (deg * Math.PI) / 180;
        const cornerX = f.cx - (side * f.width) / 2;
        const cornerY = f.y0 + f.height / 2;
        // Its centre after turning `deg` about that corner.
        const aboutCorner = (deg: number) => {
          const ox = (side * f.width) / 2;
          const oy = -f.height / 2;
          const c = Math.cos(rad(deg));
          const sn = Math.sin(rad(deg));
          return {
            x: cornerX + ox * c - oy * sn,
            y: cornerY + ox * sn + oy * c,
          };
        };

        let x: number;
        let y: number;
        let turn: number;
        let scale = 1;
        if (u < TIP) {
          // Leaning over, slowly and then faster.
          turn = side * lean * (u / TIP) ** 2;
          ({ x, y } = aboutCorner(turn));
        } else {
          // Off the edge.
          const v = (u - TIP) / (1 - TIP);
          const start = aboutCorner(side * lean);
          scale = 1 + (f.end - 1) * easeInOut(v);
          const finalY = f.landY + (f.height * f.end) / 2; // centre as the tops meet
          x = start.x + (f.slotX - start.x) * easeInOut(v);
          y = start.y + (finalY - start.y) * v * v;
          const settle = v < 0.7 ? 0 : easeInOut((v - 0.7) / 0.3);
          turn = side * (lean + f.spin * v) * (1 - settle) + f.rest * settle;
        }

        clone.style.visibility = "visible";
        clone.style.transform = `translate(${x - f.width / 2}px, ${y - f.height / 2}px) rotate(${turn}deg) scale(${scale})`;
      });
    }

    // A landing: the card sinks in and bobs up, the box jolts, the count
    // pops, and three comic impact lines flick out above the card. Timed,
    // not scroll-driven, so it plays out even if the scrolling stops.
    function impact(f: Flight) {
      const lid = lids[f.box];
      const card = f.slot;
      card.animate(
        [
          { translate: "0 0" },
          { translate: "0 10px" },
          { translate: "0 -3px" },
          { translate: "0 0" },
        ],
        {
          duration: 460,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
      lid?.crate.animate(
        [{ translate: "0 0" }, { translate: "0 5px" }, { translate: "0 0" }],
        {
          duration: 320,
          easing: "ease-out",
        },
      );
      lid?.count?.animate([{ scale: "1" }, { scale: "1.35" }, { scale: "1" }], {
        duration: 300,
        easing: "ease-out",
      });

      const rect = card.getBoundingClientRect();
      [-55, 0, 55].forEach((angle) => {
        const line = document.createElement("span");
        Object.assign(line.style, {
          position: "absolute",
          left: `${rect.left + rect.width / 2 - 2}px`,
          top: `${rect.top - 10}px`,
          width: "4px",
          height: "14px",
          background: "var(--line)",
          transformOrigin: "50% 100%",
        });
        layer!.appendChild(line);
        line
          .animate(
            [
              { transform: `rotate(${angle}deg) translateY(-4px)`, opacity: 1 },
              {
                transform: `rotate(${angle}deg) translateY(-22px)`,
                opacity: 0,
              },
            ],
            { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          )
          .finished.finally(() => line.remove());
      });
    }

    // Built on the first scroll, once the layout has settled; back at the
    // very top it all resets.
    function sync(s: number) {
      if (s > 0 && !built) {
        build();
        built = true;
      } else if (s <= 0 && built) {
        teardown();
        built = false;
      }
    }

    function tick() {
      smooth += (scrollY - smooth) * SMOOTHING;
      if (Math.abs(scrollY - smooth) < 0.5) smooth = scrollY;
      sync(smooth);
      draw(smooth);
      frame = smooth === scrollY ? 0 : requestAnimationFrame(tick);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onResize() {
      if (built) build();
      draw(smooth);
    }

    sync(smooth);
    draw(smooth);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      teardown();
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    />
  );
}
