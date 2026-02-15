export interface PortfolioItem {
  id: string;
  symbol: string;
  amount: number;
  type: 'crypto' | 'stock' | 'cash';
  value?: number; // Calculated value
  currentPrice?: number; // Live price
  sparklineData?: number[]; // Trend data for sparklines
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  type: 'crypto' | 'stock';
  currentPrice: number;
  sparklineData?: number[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

export enum RiskProfile {
  CONSERVATIVE = 'Conservative',
  MODERATE = 'Moderate',
  AGGRESSIVE = 'Aggressive'
}

export interface AnalysisResult {
  summary: string;
  recommendations: string[];
  portfolioSuggestions: string[]; // Specific allocation changes
  riskScore: number;
  diversificationScore: number;
}

export interface User {
  email: string;
  name: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
}

export type Timeframe = '1D' | '1W' | '1M' | '1Y';

export interface PerformancePoint {
  date: string;
  value: number;
}

export interface InvestmentPlanInput {
  initialAmount: number;
  monthlyContribution: number;
  targetGoal: number;
  durationYears: number;
  riskProfile: RiskProfile;
  safetyNet: number;
  includeCurrentPortfolio?: boolean;
  currentPortfolio?: PortfolioItem[];
}

export interface ProjectionYear {
  year: number;
  invested: number;
  projected: number;
}

export interface InvestmentRecommendation {
  assetName: string;
  category: 'Stock' | 'Crypto' | 'Fixed Income' | 'Cash';
  initialAllocation: number; // Dollar amount
  monthlyAllocation: number; // Dollar amount
  rationale: string;
}

export interface PlanResult {
  isFeasible: boolean;
  feasibilityScore: number; // 0-100
  projectedTotal: number;
  yearlyData: ProjectionYear[];
  executiveSummary: string; // Overview of the strategy
  recommendations: string[];
  actionablePlan: InvestmentRecommendation[]; // Specific dollar amount breakdown
  allocationStrategy: {
    safe: number; // percentage
    growth: number; // percentage
    speculative: number; // percentage
  };
  suggestedAssets: { // Specific examples
    safe: string[];
    growth: string[];
    speculative: string[];
  };
  currentPortfolioAnalysis?: {
    alignmentScore: number; // 0-100
    currentAllocation: {
      safe: number;
      growth: number;
      speculative: number;
    };
    alignmentAnalysis: string;
    rebalancingSuggestions: string[];
  };
}