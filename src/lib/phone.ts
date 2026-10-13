import { fromBnDigits } from "./bn";

/**
 * Normalize a Bangladeshi mobile number to the 11-digit local form "01XXXXXXXXX".
 * Accepts Bengali digits, spaces, dashes, dots, brackets and the +88 / 88 / 0088 country prefixes.
 * Returns null when the value is not a valid Bangladeshi mobile number.
 */
export function normalizeBdPhone(input: string): string | null {
  let digits = fromBnDigits(input).replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0088")) digits = digits.slice(4);
  else if (digits.startsWith("88") && digits.length === 13) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`;
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
}
