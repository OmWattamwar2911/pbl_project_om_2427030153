import { GoogleGenAI, Type } from "@google/genai";
import { PortfolioItem, RiskProfile, AnalysisResult, MarketIndex, NewsItem, InvestmentPlanInput, PlanResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzePortfolio = async (
  portfolio: PortfolioItem[],
  riskProfile: RiskProfile,
  marketIndices: MarketIndex[],
  recentNews: NewsItem[]
): Promise<AnalysisResult> => {
  
  const portfolioSummary = portfolio.map(p => 
    `${p.amount} units of ${p.symbol} (${p.type}) valued at $${p.value?.toFixed(2)}`
  ).join(', ');

  const marketContext = marketIndices.map(m => `${m.name}: ${m.change > 0 ? '+' : ''}${m.change}%`).join(', ');
  const newsContext = recentNews.map(n => n.title).join('. ');

  const prompt = `
    You are an expert AI financial advisor. 
    
    Current Market Context:
    Indices: ${marketContext}
    Key Headlines: ${newsContext}

    Client Profile:
    Risk Tolerance: ${riskProfile}
    
    Client Portfolio:
    ${portfolioSummary}

    Task:
    Analyze the portfolio in the context of current market conditions and the client's risk profile.
    
    Provide:
    1. A brief summary of the allocation health considering the market news.
    2. 3-4 specific, actionable recommendations (buy/sell/hold/rebalance).
    3. 2-3 concrete portfolio allocation suggestions (e.g., "Increase Tech allocation by 5%", "Allocate 10% to Gold for hedging", "Reduce exposure to crypto by 2%").
    4. A risk score from 1-100 (100 = high risk).
    5. A diversification score from 1-100 (100 = well diversified).

    Return the response as a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            portfolioSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            riskScore: { type: Type.INTEGER },
            diversificationScore: { type: Type.INTEGER }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    // Ensure arrays exist
    if (!result.recommendations) result.recommendations = [];
    if (!result.portfolioSuggestions) result.portfolioSuggestions = [];
    
    return result as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing portfolio:", error);
    return {
      summary: "Unable to connect to AI Advisor. Please verify your API key.",
      recommendations: ["Maintain current positions until connection is restored.", "Monitor market news manually."],
      portfolioSuggestions: ["Review asset allocation manually.", "Check internet connection."],
      riskScore: 50,
      diversificationScore: 50
    };
  }
};

export const generateInvestmentPlan = async (input: InvestmentPlanInput): Promise<PlanResult> => {
  let portfolioContext = "";
  if (input.includeCurrentPortfolio && input.currentPortfolio) {
    const totalValue = input.currentPortfolio.reduce((sum, item) => sum + (item.value || 0), 0);
    const summary = input.currentPortfolio.map(p => 
        `${p.symbol} (${p.type}): $${p.value?.toFixed(2)}`
    ).join(', ');
    portfolioContext = `
    Current Portfolio (Total Value: $${totalValue}):
    ${summary}
    
    IMPORTANT: The user wants to link this existing portfolio to the plan.
    `;
  }

  const prompt = `
    Act as a sophisticated financial projection engine and wealth planner.
    Create a comprehensive investment plan based on these parameters:
    - Initial Investment: $${input.initialAmount}
    - Monthly Contribution: $${input.monthlyContribution}
    - Target Goal: $${input.targetGoal}
    - Time Horizon: ${input.durationYears} years
    - Risk Profile: ${input.riskProfile}
    - Required Safety Net (Safe Assets): $${input.safetyNet}

    ${portfolioContext}

    Task:
    1. Calculate the projected growth year-over-year.
    2. Determine if the goal is feasible.
    3. Suggest a high-level allocation strategy (Safe vs Growth vs Speculative).
    4. **CRITICAL**: Create a specific "Actionable Plan". Breakdown exactly how much money ($) from the Initial Investment and the Monthly Contribution should go into specific assets.
       - For "Safe", consider Fixed Deposits (FD) or Bonds.
       - For "Growth", consider Stocks or ETFs.
       - For "Speculative", consider Crypto.
       - Provide specific dollar amounts for at least 3-5 distinct assets.

    Constraints:
    - Keep executiveSummary concise (under 100 words).
    - Limit recommendations to max 5 items.
    - Limit suggestedAssets lists to max 5 items each.

    Output JSON structure:
    - isFeasible: boolean
    - feasibilityScore: 0-100
    - projectedTotal: number
    - yearlyData: Array { year, invested, projected }
    - executiveSummary: string
    - recommendations: Array of strings
    - allocationStrategy: { safe, growth, speculative } (percentages)
    - suggestedAssets: { safe: [], growth: [], speculative: [] } (string arrays of names)
    - actionablePlan: Array of objects { 
        assetName: string, 
        category: 'Stock' | 'Crypto' | 'Fixed Income' | 'Cash', 
        initialAllocation: number (dollar amount), 
        monthlyAllocation: number (dollar amount),
        rationale: string 
      }
    - currentPortfolioAnalysis: (Optional) { alignmentScore, currentAllocation, alignmentAnalysis, rebalancingSuggestions }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFeasible: { type: Type.BOOLEAN },
            feasibilityScore: { type: Type.INTEGER },
            projectedTotal: { type: Type.NUMBER },
            yearlyData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.INTEGER },
                  invested: { type: Type.NUMBER },
                  projected: { type: Type.NUMBER }
                }
              }
            },
            executiveSummary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            allocationStrategy: {
              type: Type.OBJECT,
              properties: {
                safe: { type: Type.NUMBER },
                growth: { type: Type.NUMBER },
                speculative: { type: Type.NUMBER }
              }
            },
            suggestedAssets: {
              type: Type.OBJECT,
              properties: {
                safe: { type: Type.ARRAY, items: { type: Type.STRING } },
                growth: { type: Type.ARRAY, items: { type: Type.STRING } },
                speculative: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            actionablePlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        assetName: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['Stock', 'Crypto', 'Fixed Income', 'Cash'] },
                        initialAllocation: { type: Type.NUMBER },
                        monthlyAllocation: { type: Type.NUMBER },
                        rationale: { type: Type.STRING }
                    }
                }
            },
            currentPortfolioAnalysis: {
              type: Type.OBJECT,
              properties: {
                alignmentScore: { type: Type.INTEGER },
                currentAllocation: {
                  type: Type.OBJECT,
                  properties: {
                    safe: { type: Type.NUMBER },
                    growth: { type: Type.NUMBER },
                    speculative: { type: Type.NUMBER }
                  }
                },
                alignmentAnalysis: { type: Type.STRING },
                rebalancingSuggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = JSON.parse(text);
    
    // Default Fallbacks for UI safety
    if (!parsed.allocationStrategy) parsed.allocationStrategy = { safe: 20, growth: 60, speculative: 20 };
    if (!parsed.suggestedAssets) parsed.suggestedAssets = { safe: ["FD/Bonds"], growth: ["ETFs"], speculative: ["Crypto"] };
    if (!parsed.recommendations) parsed.recommendations = [];
    if (!parsed.yearlyData) parsed.yearlyData = [];
    if (!parsed.actionablePlan) parsed.actionablePlan = [];
    
    return parsed as PlanResult;

  } catch (error) {
    console.error("Error generating plan:", error);
    // Fallback logic
    const rate = input.riskProfile === 'Aggressive' ? 0.10 : input.riskProfile === 'Moderate' ? 0.07 : 0.04;
    const yearlyData = [];
    let currentVal = input.initialAmount;
    let totalInvested = input.initialAmount;
    
    for(let i=1; i<=input.durationYears; i++) {
        currentVal = (currentVal + (input.monthlyContribution * 12)) * (1 + rate);
        totalInvested += (input.monthlyContribution * 12);
        yearlyData.push({ year: i, invested: totalInvested, projected: currentVal });
    }

    return {
        isFeasible: currentVal >= input.targetGoal,
        feasibilityScore: Math.min(100, Math.round((currentVal / input.targetGoal) * 100)),
        projectedTotal: currentVal,
        yearlyData,
        executiveSummary: "Based on historical averages, your plan requires disciplined contributions. Consider diversifying to optimize returns.",
        recommendations: ["Increase monthly contributions to secure goal.", "Review risk tolerance."],
        allocationStrategy: { safe: 30, growth: 50, speculative: 20 },
        suggestedAssets: {
            safe: ["Government Bonds", "Fixed Deposits (FD)"],
            growth: ["S&P 500 ETF", "Total World Stock ETF"],
            speculative: ["Bitcoin", "Sector-specific ETFs"]
        },
        actionablePlan: [
            { assetName: "S&P 500 ETF", category: "Stock", initialAllocation: input.initialAmount * 0.5, monthlyAllocation: input.monthlyContribution * 0.5, rationale: "Core growth driver" },
            { assetName: "Government Bonds/FD", category: "Fixed Income", initialAllocation: input.initialAmount * 0.3, monthlyAllocation: input.monthlyContribution * 0.3, rationale: "Stability and safety" },
            { assetName: "Bitcoin/Eth", category: "Crypto", initialAllocation: input.initialAmount * 0.2, monthlyAllocation: input.monthlyContribution * 0.2, rationale: "High potential returns" }
        ]
    };
  }
};