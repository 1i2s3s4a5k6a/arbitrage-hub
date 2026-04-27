/**
 * Arbitrage Detection Engine
 * Detects 2-way and 3-way arbitrage opportunities
 * Calculates stake distribution, profit percentage, and ROI
 */

export interface OddsOption {
  bookmaker: string;
  market: string;
  option: string;
  odds: number;
}

export interface ArbitrageResult {
  type: "2-way" | "3-way";
  profitPercentage: number;
  roi: number;
  riskLevel: "low" | "medium" | "high";
  stakeDistribution: Record<string, number>;
  bookmakers: Array<{
    bookmaker: string;
    option: string;
    odds: number;
    stake: number;
  }>;
  totalStake: number;
  guaranteedProfit: number;
}

/**
 * Calculate 2-way arbitrage (e.g., Home vs Away)
 * Formula: (1/odds1 + 1/odds2) < 1 means arbitrage exists
 */
export function calculate2WayArbitrage(
  option1: OddsOption,
  option2: OddsOption,
  totalStake: number = 100
): ArbitrageResult | null {
  const odds1 = option1.odds;
  const odds2 = option2.odds;

  // Calculate implied probability sum
  const impliedProbabilitySum = 1 / odds1 + 1 / odds2;

  // If sum >= 1, no arbitrage exists
  if (impliedProbabilitySum >= 1) {
    return null;
  }

  // Calculate arbitrage percentage (profit margin)
  const arbitragePercentage = (1 - impliedProbabilitySum) * 100;

  // Calculate stake distribution using proportional method
  const stake1 = (totalStake * (1 / odds1)) / impliedProbabilitySum;
  const stake2 = (totalStake * (1 / odds2)) / impliedProbabilitySum;

  // Calculate guaranteed profit
  // When we place stake1 at odds1, we get stake1 * odds1 if we win
  // When we place stake2 at odds2, we get stake2 * odds2 if we win
  // Both should equal totalStake for a perfect arbitrage
  const totalStakePlaced = stake1 + stake2;
  const returnIfOption1Wins = stake1 * odds1;
  const returnIfOption2Wins = stake2 * odds2;
  const guaranteedProfit = Math.min(returnIfOption1Wins, returnIfOption2Wins) - totalStakePlaced;
  const roi = totalStakePlaced > 0 ? (guaranteedProfit / totalStakePlaced) * 100 : 0;

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  if (arbitragePercentage < 1) riskLevel = "high";
  else if (arbitragePercentage < 2) riskLevel = "medium";

  return {
    type: "2-way",
    profitPercentage: arbitragePercentage,
    roi,
    riskLevel,
    stakeDistribution: {
      [option1.option]: stake1,
      [option2.option]: stake2,
    },
    bookmakers: [
      {
        bookmaker: option1.bookmaker,
        option: option1.option,
        odds: odds1,
        stake: stake1,
      },
      {
        bookmaker: option2.bookmaker,
        option: option2.option,
        odds: odds2,
        stake: stake2,
      },
    ],
    totalStake: stake1 + stake2,
    guaranteedProfit,
  };
}

/**
 * Calculate 3-way arbitrage (e.g., Home vs Draw vs Away)
 * Formula: (1/odds1 + 1/odds2 + 1/odds3) < 1 means arbitrage exists
 */
export function calculate3WayArbitrage(
  option1: OddsOption,
  option2: OddsOption,
  option3: OddsOption,
  totalStake: number = 100
): ArbitrageResult | null {
  const odds1 = option1.odds;
  const odds2 = option2.odds;
  const odds3 = option3.odds;

  // Calculate implied probability sum
  const impliedProbabilitySum = 1 / odds1 + 1 / odds2 + 1 / odds3;

  // If sum >= 1, no arbitrage exists
  if (impliedProbabilitySum >= 1) {
    return null;
  }

  // Calculate arbitrage percentage (profit margin)
  const arbitragePercentage = (1 - impliedProbabilitySum) * 100;

  // Calculate stake distribution using proportional method
  const stake1 = (totalStake * (1 / odds1)) / impliedProbabilitySum;
  const stake2 = (totalStake * (1 / odds2)) / impliedProbabilitySum;
  const stake3 = (totalStake * (1 / odds3)) / impliedProbabilitySum;

  // Calculate guaranteed profit
  // When we place stakes, each outcome should return approximately totalStake
  const totalStakePlaced = stake1 + stake2 + stake3;
  const returnIfOption1Wins = stake1 * odds1;
  const returnIfOption2Wins = stake2 * odds2;
  const returnIfOption3Wins = stake3 * odds3;
  const guaranteedProfit = Math.min(returnIfOption1Wins, returnIfOption2Wins, returnIfOption3Wins) - totalStakePlaced;
  const roi = totalStakePlaced > 0 ? (guaranteedProfit / totalStakePlaced) * 100 : 0;

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" = "low";
  if (arbitragePercentage < 0.5) riskLevel = "high";
  else if (arbitragePercentage < 1) riskLevel = "medium";

  return {
    type: "3-way",
    profitPercentage: arbitragePercentage,
    roi,
    riskLevel,
    stakeDistribution: {
      [option1.option]: stake1,
      [option2.option]: stake2,
      [option3.option]: stake3,
    },
    bookmakers: [
      {
        bookmaker: option1.bookmaker,
        option: option1.option,
        odds: odds1,
        stake: stake1,
      },
      {
        bookmaker: option2.bookmaker,
        option: option2.option,
        odds: odds2,
        stake: stake2,
      },
      {
        bookmaker: option3.bookmaker,
        option: option3.option,
        odds: odds3,
        stake: stake3,
      },
    ],
    totalStake: stake1 + stake2 + stake3,
    guaranteedProfit,
  };
}

/**
 * Find best 2-way arbitrage opportunities from a list of odds
 */
export function findBest2WayArbitrages(
  oddsOptions: OddsOption[],
  minProfitPercentage: number = 0.5
): ArbitrageResult[] {
  const opportunities: ArbitrageResult[] = [];

  // Compare all pairs of odds
  for (let i = 0; i < oddsOptions.length; i++) {
    for (let j = i + 1; j < oddsOptions.length; j++) {
      const arb = calculate2WayArbitrage(oddsOptions[i], oddsOptions[j]);
      if (arb && arb.profitPercentage >= minProfitPercentage) {
        opportunities.push(arb);
      }
    }
  }

  // Sort by profit percentage descending
  return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
}

/**
 * Find best 3-way arbitrage opportunities from a list of odds
 */
export function findBest3WayArbitrages(
  oddsOptions: OddsOption[],
  minProfitPercentage: number = 0.3
): ArbitrageResult[] {
  const opportunities: ArbitrageResult[] = [];

  // Compare all triplets of odds
  for (let i = 0; i < oddsOptions.length; i++) {
    for (let j = i + 1; j < oddsOptions.length; j++) {
      for (let k = j + 1; k < oddsOptions.length; k++) {
        const arb = calculate3WayArbitrage(
          oddsOptions[i],
          oddsOptions[j],
          oddsOptions[k]
        );
        if (arb && arb.profitPercentage >= minProfitPercentage) {
          opportunities.push(arb);
        }
      }
    }
  }

  // Sort by profit percentage descending
  return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
}

/**
 * Detect sharp money signals (significant odds movements)
 * Returns true if odds have moved significantly (>5% change)
 */
export function detectSharpMoney(
  previousOdds: number,
  currentOdds: number,
  threshold: number = 0.05
): boolean {
  const change = Math.abs(currentOdds - previousOdds) / previousOdds;
  return change > threshold;
}

/**
 * Calculate middling opportunity
 * Occurs when odds shift favorably after placing a bet
 * Can win both sides of a 2-way bet
 */
export function detectMiddlingOpportunity(
  initialOdds1: number,
  initialOdds2: number,
  currentOdds1: number,
  currentOdds2: number,
  initialStake: number = 100
): { isMiddling: boolean; profit: number } | null {
  // Check if we can now place a bet on the opposite side at better odds
  const initialImplied = 1 / initialOdds1 + 1 / initialOdds2;
  const currentImplied = 1 / currentOdds1 + 1 / currentOdds2;

  // If current implied probability is lower, middling opportunity exists
  if (currentImplied < initialImplied) {
    // Profit from the arbitrage created by the odds shift
    const arbitragePercentage = (1 - currentImplied) * 100;
    const middlingProfit = (initialStake * arbitragePercentage) / 100;
    return {
      isMiddling: true,
      profit: middlingProfit,
    };
  }

  return null;
}
