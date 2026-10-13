import "server-only";

/** SETUP_TOKEN must be set (≥16 characters) for first-time admin setup to be possible at all. */
export function setupToken(): string | null {
  const token = process.env.SETUP_TOKEN?.trim();
  return token && token.length >= 16 ? token : null;
}
