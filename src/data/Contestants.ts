// Years and default year of the traditional contest (ESC). Other contests
// declare their own in Contests.ts, which is also where year sanitizing lives.
export const supportedYears = Array.from(
  { length: 2026 - 1956 + 1 }, 
  (v, i) => ((1956 + i).toString())
).reverse();

export const defaultYear = '2026';
