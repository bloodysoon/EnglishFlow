// How hard a word is for this learner, 1 (forgets it sometimes) to 3
// (forgets it most of the time). Both the share of forgotten reviews and
// the raw count matter: 5 lapses out of 20 is still a struggle.
export type Difficulty = 1 | 2 | 3;

export function wordDifficulty(forgot: number, reviews: number): Difficulty {
  const rate = reviews > 0 ? forgot / reviews : 0;
  if (rate >= 0.6 || forgot >= 5) return 3;
  if (rate >= 0.4 || forgot >= 3) return 2;
  return 1;
}
