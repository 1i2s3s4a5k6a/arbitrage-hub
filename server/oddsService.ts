/**
 * Odds API Integration Service
 * Fetches real-time odds from The Odds API v4
 * API Documentation: https://the-odds-api.com/liveapi/guides/v4/
 *
 * FIX: The Odds API v4 returns a plain JSON array, NOT { success, data }.
 * The previous code checked data.success which was always undefined,
 * causing every odds fetch to throw "Failed to fetch odds from API".
 */

import { ENV } from "./_core/env";

// ── Types matching the actual Odds API v4 response ─────────────────────────

interface OddsApiMatch {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

export interface NormalizedOdds {
  matchId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: Array<{
    bookmaker: string;
    bookmakerKey: string;
    markets: Array<{
      market: string;
      outcomes: Array<{
        option: string;
        odds: number;
      }>;
    }>;
  }>;
}

const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";

/**
 * Fetch live odds from The Odds API.
 *
 * The API key is sent as a query parameter (required by this API).
 * Do not log the full URL in production to avoid key exposure in log systems.
 */
export async function fetchLiveOdds(
  sportKey = "soccer_epl",
  markets = "h2h",
  regions = "eu"
): Promise<NormalizedOdds[]> {
  const apiKey = ENV.oddsApiKey;
  if (!apiKey) throw new Error("ODDS_API_KEY is not configured");

  const params = new URLSearchParams({ apiKey, markets, regions, oddsFormat: "decimal" });
  const url = `${ODDS_API_BASE_URL}/sports/${encodeURIComponent(sportKey)}/odds?${params}`;

  const response = await fetch(url);

  if (response.status === 401) throw new Error("Odds API: invalid API key");
  if (response.status === 429) throw new Error("Odds API: quota exceeded");
  if (!response.ok)
    throw new Error(`Odds API error: ${response.status} ${response.statusText}`);

  // v4 returns a plain array — NOT { success, data }
  const data: OddsApiMatch[] = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Odds API: unexpected response shape");
  }

  return normalizeOdds(data);
}

/**
 * Fetch available sports from The Odds API.
 */
export async function fetchAvailableSports(): Promise<
  Array<{ key: string; title: string; active: boolean }>
> {
  const apiKey = ENV.oddsApiKey;
  if (!apiKey) throw new Error("ODDS_API_KEY is not configured");

  const params = new URLSearchParams({ apiKey, all: "true" });
  const response = await fetch(`${ODDS_API_BASE_URL}/sports?${params}`);

  if (!response.ok)
    throw new Error(`Odds API error: ${response.status} ${response.statusText}`);

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// ── Internal helpers ───────────────────────────────────────────────────────

function normalizeOdds(raw: OddsApiMatch[]): NormalizedOdds[] {
  return raw.map((match) => ({
    matchId: match.id,
    sport: match.sport_key,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    commenceTime: match.commence_time,
    bookmakers: match.bookmakers.map((bm) => ({
      bookmaker: bm.title,
      bookmakerKey: bm.key,
      markets: bm.markets.map((mkt) => ({
        market: mkt.key,
        outcomes: mkt.outcomes.map((o) => ({ option: o.name, odds: o.price })),
      })),
    })),
  }));
}

export function extractMarketOdds(
  normalizedOdds: NormalizedOdds[],
  market = "h2h"
): Array<{
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  bookmaker: string;
  option: string;
  odds: number;
}> {
  const result: ReturnType<typeof extractMarketOdds> = [];

  for (const match of normalizedOdds) {
    for (const bm of match.bookmakers) {
      const mkt = bm.markets.find((m) => m.market === market);
      if (!mkt) continue;
      for (const outcome of mkt.outcomes) {
        result.push({
          matchId: match.matchId,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          bookmaker: bm.bookmaker,
          option: outcome.option,
          odds: outcome.odds,
        });
      }
    }
  }

  return result;
}

export function findBestOdds(
  marketOdds: ReturnType<typeof extractMarketOdds>
): Map<string, { option: string; odds: number; bookmaker: string }> {
  const best = new Map<string, { option: string; odds: number; bookmaker: string }>();

  for (const odd of marketOdds) {
    const existing = best.get(odd.option);
    if (!existing || odd.odds > existing.odds) {
      best.set(odd.option, {
        option: odd.option,
        odds: odd.odds,
        bookmaker: odd.bookmaker,
      });
    }
  }

  return best;
}

export function calculateOddsMovement(
  previousOdds: number,
  currentOdds: number
): { movement: number; percentageChange: number; direction: "up" | "down" | "stable" } {
  const movement = currentOdds - previousOdds;
  const percentageChange = (movement / previousOdds) * 100;
  const direction = movement > 0.01 ? "up" : movement < -0.01 ? "down" : "stable";
  return { movement, percentageChange, direction };
}

export function detectSharpMoneySignal(
  previousOdds: number,
  currentOdds: number,
  threshold = 5
): boolean {
  const { percentageChange } = calculateOddsMovement(previousOdds, currentOdds);
  return Math.abs(percentageChange) > threshold;
}
