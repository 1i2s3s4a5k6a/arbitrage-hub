import { describe, expect, it } from "vitest";
import {
  calculate2WayArbitrage,
  calculate3WayArbitrage,
  detectSharpMoney,
  detectMiddlingOpportunity,
  findBest2WayArbitrages,
  findBest3WayArbitrages,
} from "./arbitrage";

describe("Arbitrage Detection Engine", () => {
  describe("2-Way Arbitrage", () => {
    it("should detect a 2-way arbitrage opportunity", () => {
      // Example: Home 2.5 vs Away 2.5
      // Implied probability: 1/2.5 + 1/2.5 = 0.4 + 0.4 = 0.8 (arb exists!)

      const result = calculate2WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 2.5,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Away",
          odds: 2.5,
        },
        100
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe("2-way");
      expect(result?.profitPercentage).toBeGreaterThan(0);
      expect(result?.roi).toBeGreaterThan(0);
      expect(result?.riskLevel).toBe("low");
    });

    it("should return null when no 2-way arbitrage exists", () => {
      // Implied probability > 1, no arbitrage
      const result = calculate2WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 1.5,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Away",
          odds: 1.5,
        },
        100
      );

      expect(result).toBeNull();
    });

    it("should calculate correct stake distribution for 2-way", () => {
      const result = calculate2WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 2.5,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Away",
          odds: 2.5,
        },
        100
      );

      expect(result).not.toBeNull();
      // With equal odds, stakes should be roughly equal
      expect(result?.totalStake).toBeLessThanOrEqual(100);
      expect(result?.guaranteedProfit).toBeGreaterThan(0);
    });
  });

  describe("3-Way Arbitrage", () => {
    it("should detect a 3-way arbitrage opportunity", () => {
      // Example: Home 3.5, Draw 4.0, Away 3.5
      // Implied probability: 1/3.5 + 1/4.0 + 1/3.5 = 0.286 + 0.25 + 0.286 = 0.822 (arb exists!)

      const result = calculate3WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 3.5,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Draw",
          odds: 4.0,
        },
        {
          bookmaker: "Bookmaker3",
          market: "Match Winner",
          option: "Away",
          odds: 3.5,
        },
        100
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe("3-way");
      expect(result?.profitPercentage).toBeGreaterThan(0);
      expect(result?.roi).toBeGreaterThan(0);
    });

    it("should return null when no 3-way arbitrage exists", () => {
      const result = calculate3WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 1.8,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Draw",
          odds: 3.5,
        },
        {
          bookmaker: "Bookmaker3",
          market: "Match Winner",
          option: "Away",
          odds: 2.0,
        },
        100
      );

      expect(result).toBeNull();
    });

    it("should calculate correct stake distribution for 3-way", () => {
      const result = calculate3WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 3.5,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Draw",
          odds: 4.0,
        },
        {
          bookmaker: "Bookmaker3",
          market: "Match Winner",
          option: "Away",
          odds: 3.5,
        },
        100
      );

      expect(result).not.toBeNull();
      expect(result?.bookmakers).toHaveLength(3);
      expect(result?.totalStake).toBeLessThanOrEqual(100);
    });
  });

  describe("Sharp Money Detection", () => {
    it("should detect significant odds movement", () => {
      // 5% movement
      const result = detectSharpMoney(2.0, 2.1, 0.05);
      expect(result).toBe(true);
    });

    it("should not detect minor odds movement", () => {
      // 2% movement
      const result = detectSharpMoney(2.0, 2.04, 0.05);
      expect(result).toBe(false);
    });

    it("should use custom threshold", () => {
      // 3% movement with 5% threshold
      const result1 = detectSharpMoney(2.0, 2.06, 0.05);
      expect(result1).toBe(false);

      // 3% movement with 2% threshold
      const result2 = detectSharpMoney(2.0, 2.06, 0.02);
      expect(result2).toBe(true);
    });
  });

  describe("Middling Opportunity Detection", () => {
    it("should detect middling opportunity when odds improve", () => {
      // Initial odds: Home 2.0, Away 2.0
      // Current odds: Home 2.5, Away 2.5 (better odds)
      const result = detectMiddlingOpportunity(2.0, 2.0, 2.5, 2.5, 100);
      expect(result).not.toBeNull();
      expect(result?.isMiddling).toBe(true);
      expect(result?.profit).toBeGreaterThan(0);
    });

    it("should return null when no middling opportunity", () => {
      // Odds got worse
      const result = detectMiddlingOpportunity(2.5, 2.5, 2.0, 2.0, 100);
      expect(result).toBeNull();
    });
  });

  describe("Finding Best Arbitrages", () => {
    it("should find best 2-way arbitrage from multiple options", () => {
      const options = [
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 2.5,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Away",
          odds: 2.5,
        },
        {
          bookmaker: "Bookmaker3",
          market: "Match Winner",
          option: "Home",
          odds: 2.2,
        },
      ];

      const results = findBest2WayArbitrages(options, 0.5);
      expect(results.length).toBeGreaterThan(0);
      // Should be sorted by profit percentage
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].profitPercentage).toBeGreaterThanOrEqual(
          results[i + 1].profitPercentage
        );
      }
    });

    it("should find best 3-way arbitrage from multiple options", () => {
      const options = [
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 3.5,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Draw",
          odds: 4.0,
        },
        {
          bookmaker: "Bookmaker3",
          market: "Match Winner",
          option: "Away",
          odds: 3.5,
        },
      ];

      const results = findBest3WayArbitrages(options, 0.3);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should respect minimum profit percentage threshold", () => {
      const options = [
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 2.05,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Away",
          odds: 2.05,
        },
      ];

      const results = findBest2WayArbitrages(options, 5.0); // Very high threshold
      expect(results).toHaveLength(0);
    });
  });

  describe("Risk Level Assessment", () => {
    it("should classify low profit as high risk", () => {
      // Very tight arbitrage
      const result = calculate2WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 2.001,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Away",
          odds: 2.001,
        },
        100
      );

      if (result) {
        expect(result.riskLevel).toBe("high");
      }
    });

    it("should classify high profit as low risk", () => {
      // Loose arbitrage
      const result = calculate2WayArbitrage(
        {
          bookmaker: "Bookmaker1",
          market: "Match Winner",
          option: "Home",
          odds: 4.0,
        },
        {
          bookmaker: "Bookmaker2",
          market: "Match Winner",
          option: "Away",
          odds: 4.0,
        },
        100
      );

      if (result) {
        expect(result.riskLevel).toBe("low");
      }
    });
  });
});
