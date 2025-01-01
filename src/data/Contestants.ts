import { Contestant } from "./Contestant";

export const supportedYears = Array.from(
  { length: 2025 - 1956 + 1 }, 
  (v, i) => ((1956 + i).toString())
).reverse();

/**
 * Converts the provided year from 2 digits to 4 if necessary
 * 
 * @param contestYear 
 * @returns 
 */
export function sanitizeYear(contestYear: string | null): string {
  if (contestYear?.length === 2) {
      if ((parseInt(contestYear) < 40)) {
          return '20' + contestYear;
      } else {
          return '19' + contestYear;
      }
  } else if (contestYear?.length === 4) {
    return contestYear;
  }
  return defaultYear;
}

export const defaultYear = '2024';