// Mathematical XP curve — matches the spec: L1=0, L2=100, L3=250, L4=450 ...
// (each level costs 50 XP more than the previous jump). No hardcoded table.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let k = 1; k < level; k++) total += 100 + 50 * (k - 1);
  return total;
}

export function levelFromXP(xp: number): number {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
}

// Server-side-only XP awarding. The client never sends XP values —
// it sends selected answers, and this function is the single source
// of truth for what those answers are worth.
export const XP_RULES = {
  CORRECT: 10,
  FAST_BONUS: 5, // awarded if timeTakenMs < FAST_THRESHOLD_MS
  FAST_THRESHOLD_MS: 10_000,
  PERFECT_QUIZ_BONUS: 50, // quiz length >= 5 and 100% accuracy
  DAILY_CHALLENGE_BONUS: 100,
  DAILY_CHALLENGE_COINS: 25,
  TOPIC_COMPLETION_BONUS: 100,
  ACHIEVEMENT_BONUS: 50,
};

export function isYesterday(a: Date, b: Date): boolean {
  const prev = new Date(b);
  prev.setDate(prev.getDate() - 1);
  return sameDay(a, prev);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
