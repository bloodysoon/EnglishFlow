// Where each badge of the scroll-dealt deck sits at a moment of the scroll.
// t counts deals: during [s, s + 1] the front badge s swings out to its side,
// then tucks in at the back while the rest of the pile moves one pose forward.

export type Pose = { x: number; y: number; rotate: number; scale: number };

// Resting poses, front to back; tucked badges share the last one.
export const SLOTS: readonly Pose[] = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 16, y: 12, rotate: 3, scale: 0.965 },
  { x: -14, y: 20, rotate: -3.5, scale: 0.94 },
  { x: 2, y: 24, rotate: 1.5, scale: 0.925 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeIn = (v: number) => v * v;
const easeOut = (v: number) => 1 - (1 - v) * (1 - v);
const easeInOut = (v: number) =>
  v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;

function mix(a: Pose, b: Pose, k: number): Pose {
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    rotate: a.rotate + (b.rotate - a.rotate) * k,
    scale: a.scale + (b.scale - a.scale) * k,
  };
}

const slot = (k: number) => SLOTS[Math.min(Math.max(k, 0), SLOTS.length - 1)];

// side: -1 swings left, 1 right. outX: how far it swings (px).
export function badgePose(
  index: number,
  t: number,
  side: -1 | 1,
  outX: number,
): Pose {
  const back = SLOTS[SLOTS.length - 1];

  // Its own deal.
  if (t >= index) {
    const u = t - index;
    const out: Pose = { x: side * outX, y: -26, rotate: side * 15, scale: 1 };
    if (u < 0.48) return mix(SLOTS[0], out, easeIn(u / 0.48));
    if (u < 0.52) return out;
    return mix(out, back, easeOut(clamp01((u - 0.52) / 0.42)));
  }

  // Waiting in the pile: every earlier deal moves it one pose forward.
  let rank = index;
  for (let s = 0; s < index && s <= t; s++) {
    rank -= easeInOut(clamp01((t - s - 0.3) / 0.5));
  }
  const near = Math.floor(rank);
  return mix(slot(near), slot(near + 1), rank - near);
}

// Front badges stay on top until they tuck in behind the pile.
export function badgeLayer(index: number, t: number): number {
  return t >= index + 0.5 ? 30 - index : 50 - index;
}
