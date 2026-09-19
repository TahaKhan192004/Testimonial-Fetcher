import "server-only";

/** Plain link to the Google Maps Lead Scraper extension. Nothing is gated or emailed. */
export function rewardUrl(): string | null {
  return process.env.REWARD_ACCESS_URL?.trim() || null;
}
