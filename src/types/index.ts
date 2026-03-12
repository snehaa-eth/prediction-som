export type MarketCategory = 'Crypto' | 'Politics' | 'Sports' | 'Tech' | 'Global';

export interface Market {
  id: string;
  question: string;
  category: MarketCategory;
  yesProb: number;
  noProb: number;
  volume: string;
  liquidity: string;
  timeLeft: string;
  priceHistory: number[];
}

export interface Position {
  id: string;
  marketId: string;
  question: string;
  prediction: 'YES' | 'NO';
  amount: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  resolved: boolean;
}

export interface Activity {
  id: string;
  type: 'trade' | 'win' | 'loss';
  market: string;
  amount: number;
  timestamp: string;
  prediction?: 'YES' | 'NO';
}

export interface UserProfile {
  walletAddress: string;
  shortAddress: string;
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  balance: number;
  rank: number;
}
