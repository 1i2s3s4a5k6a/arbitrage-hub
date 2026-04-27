/**
 * Odds service integration tests.
 * Requires ODDS_API_KEY in your local .env to run against the live API.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchLiveOdds, extractMarketOdds, findBestOdds } from "./oddsService";

describe("oddsService", () => {
  it("ODDS_API_KEY must be set via environment — never hardcoded", () => {
    // This test ensures no key is hardcoded anywhere in the service.
    // Set ODDS_API_KEY in your .env file for local development.
    const src = require("fs").readFileSync("./server/oddsService.ts", "utf-8");
    // Check that no 32-char hex string (typical API key format) is hardcoded
    const hardcodedKeyPattern = /["'][a-f0-9]{32}["']/;
    expect(hardcodedKeyPattern.test(src)).toBe(false);
  });

  describe("extractMarketOdds", () => {
    it("extracts outcomes from normalised odds correctly", () => {
      const mockOdds = [
        {
          matchId: "match1",
          sport: "soccer_epl",
          homeTeam: "Arsenal",
          awayTeam: "Chelsea",
          commenceTime: new Date().toISOString(),
          bookmakers: [
            {
              bookmaker: "Bet365",
              bookmakerKey: "bet365",
              markets: [
                {
                  market: "h2h",
                  outcomes: [
                    { option: "Arsenal", odds: 2.1 },
                    { option: "Chelsea", odds: 3.5 },
                    { option: "Draw", odds: 3.2 },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const result = extractMarketOdds(mockOdds, "h2h");
      expect(result).toHaveLength(3);
      expect(result[0].bookmaker).toBe("Bet365");
      expect(result[0].odds).toBe(2.1);
    });
  });

  describe("findBestOdds", () => {
    it("returns the highest odds per outcome across bookmakers", () => {
      const marketOdds = [
        { matchId: "m1", homeTeam: "A", awayTeam: "B", bookmaker: "Bet365", option: "A", odds: 2.1 },
        { matchId: "m1", homeTeam: "A", awayTeam: "B", bookmaker: "Pinnacle", option: "A", odds: 2.3 },
        { matchId: "m1", homeTeam: "A", awayTeam: "B", bookmaker: "Bet365", option: "B", odds: 3.5 },
        { matchId: "m1", homeTeam: "A", awayTeam: "B", bookmaker: "Pinnacle", option: "B", odds: 3.2 },
      ];

      const best = findBestOdds(marketOdds);
      expect(best.get("A")?.odds).toBe(2.3);
      expect(best.get("A")?.bookmaker).toBe("Pinnacle");
      expect(best.get("B")?.odds).toBe(3.5);
      expect(best.get("B")?.bookmaker).toBe("Bet365");
    });
  });
});
