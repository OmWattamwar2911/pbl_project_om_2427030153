import { MarketIndex, NewsItem, Timeframe, PerformancePoint } from "../types";

// Mock data generator for demo purposes
export const getMarketIndices = (): MarketIndex[] => {
  return [
    { symbol: '^GSPC', name: 'S&P 500', price: 4783.45, change: 0.45 },
    { symbol: '^IXIC', name: 'NASDAQ', price: 15628.90, change: -0.12 },
    { symbol: 'BTC-USD', name: 'Bitcoin', price: 64230.50, change: 2.34 },
    { symbol: 'ETH-USD', name: 'Ethereum', price: 3450.20, change: 1.56 },
  ];
};

export const getFinancialNews = (): NewsItem[] => {
  return [
    { id: '1', title: 'Fed Signals Potential Rate Cuts Later This Year', source: 'Finance Daily', time: '2h ago', sentiment: 'positive', url: '#' },
    { id: '2', title: 'Tech Stocks Rally Ahead of Earnings Season', source: 'MarketWatch', time: '4h ago', sentiment: 'positive', url: '#' },
    { id: '3', title: 'Crypto Regulation Talks Heat Up in Congress', source: 'CoinDesk', time: '5h ago', sentiment: 'neutral', url: '#' },
    { id: '4', title: 'Oil Prices Dip Amid Global Demand Concerns', source: 'Bloomberg', time: '6h ago', sentiment: 'negative', url: '#' },
  ];
};

// Simulate live price updates
export const getLivePrice = (symbol: string, basePrice: number): number => {
  const volatility = 0.002; // 0.2% variance
  const change = 1 + (Math.random() * volatility * 2 - volatility);
  return basePrice * change;
};

// Generate historical data based on current value and timeframe
export const getPortfolioHistory = (timeframe: Timeframe, currentValue: number): PerformancePoint[] => {
  const points: PerformancePoint[] = [];
  const now = new Date();
  let numPoints = 20;
  let interval = 0; // ms
  let volatility = 0.01;

  switch (timeframe) {
    case '1D':
      numPoints = 24;
      interval = 3600 * 1000; // 1 hour
      volatility = 0.005;
      break;
    case '1W':
      numPoints = 7;
      interval = 24 * 3600 * 1000; // 1 day
      volatility = 0.015;
      break;
    case '1M':
      numPoints = 30;
      interval = 24 * 3600 * 1000; // 1 day
      volatility = 0.02;
      break;
    case '1Y':
      numPoints = 12;
      interval = 30 * 24 * 3600 * 1000; // ~1 month
      volatility = 0.05;
      break;
  }

  // Generate data working backwards from current value
  let price = currentValue;
  for (let i = 0; i < numPoints; i++) {
    const time = new Date(now.getTime() - (i * interval));
    
    // Format date based on timeframe
    let dateLabel = '';
    if (timeframe === '1D') dateLabel = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    else if (timeframe === '1Y') dateLabel = time.toLocaleDateString([], {month: 'short'});
    else dateLabel = time.toLocaleDateString([], {month: 'short', day: 'numeric'});

    points.unshift({ date: dateLabel, value: price });
    
    // Random walk backwards
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    price = price / change;
  }
  
  return points;
};

export const getSparklineData = (): number[] => {
    const points: number[] = [];
    let val = 50 + Math.random() * 50;
    for (let i = 0; i < 20; i++) {
      // Random walk with slight volatility
      const change = 1 + (Math.random() * 0.1 - 0.04); 
      val = val * change;
      points.push(val);
    }
    return points;
};