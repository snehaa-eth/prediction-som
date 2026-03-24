import { useState, useEffect, useCallback } from 'react';
import { Contract, formatUnits, parseUnits, MaxUint256 } from 'ethers';
import { JsonRpcProvider } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { PREDICTION_MARKET_ABI, ERC20_ABI } from '../lib/contracts/abi';
import { PREDICTION_MARKET_ADDRESS, COLLATERAL_ADDRESS, RPC_URL } from '../lib/config';
import type { Market } from '../types';

// ── Shared read-only provider ───────────────────────────────────
const readProvider = new JsonRpcProvider(RPC_URL);

const readMarketContract = new Contract(
  PREDICTION_MARKET_ADDRESS,
  PREDICTION_MARKET_ABI,
  readProvider,
);
const readTokenContract = new Contract(
  COLLATERAL_ADDRESS,
  ERC20_ABI,
  readProvider,
);

// ── Types ───────────────────────────────────────────────────────
export interface OnChainMarket {
  id: number;
  question: string;
  yesReserve: bigint;
  noReserve: bigint;
  resolved: boolean;
  winningOutcome: number;
  yesProbBps: number;
}

export interface UserStats {
  wins: number;
  losses: number;
  totalWon: bigint;
  totalLost: bigint;
}

// ── Global cache (persists across re-renders / screen switches) ─
let marketsCache: Market[] = [];
let marketsCacheTime = 0;
const CACHE_TTL = 30_000; // 30s

// ── Convert on-chain market → UI Market type ────────────────────
function toUIMarket(m: OnChainMarket): Market {
  const yesProb = Math.round(m.yesProbBps / 100);
  const noProb = 100 - yesProb;
  const totalReserve = m.yesReserve + m.noReserve;
  const liqNum = Number(formatUnits(totalReserve, 18));
  return {
    id: String(m.id),
    question: m.question,
    category: 'Crypto',
    yesProb,
    noProb,
    volume: `${liqNum.toFixed(0)} TFY`,
    liquidity: `${liqNum.toFixed(0)} TFY`,
    timeLeft: m.resolved ? 'Resolved' : 'Open',
    priceHistory: [yesProb],
  };
}

// ── Fetch single market (parallel-friendly) ─────────────────────
async function fetchOneMarket(i: number): Promise<Market> {
  const [[question, yesReserve, noReserve, resolved, winningOutcome], yesProbBps] =
    await Promise.all([
      readMarketContract.getMarket(i),
      readMarketContract.getYesProbability(i),
    ]);
  return toUIMarket({
    id: i,
    question,
    yesReserve,
    noReserve,
    resolved,
    winningOutcome: Number(winningOutcome),
    yesProbBps: Number(yesProbBps),
  });
}

// ── Hook: fetch all markets (parallel + cached) ─────────────────
export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>(marketsCache);
  const [loading, setLoading] = useState(marketsCache.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async (force = false) => {
    // Return cache if fresh and not forced
    if (!force && marketsCache.length > 0 && Date.now() - marketsCacheTime < CACHE_TTL) {
      setMarkets(marketsCache);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const count: bigint = await readMarketContract.marketCount();
      const n = Number(count);
      if (n === 0) {
        setMarkets([]);
        marketsCache = [];
        return;
      }

      // Fetch all markets in parallel
      const promises = Array.from({ length: n }, (_, i) => fetchOneMarket(i));
      const results = await Promise.all(promises);

      marketsCache = results;
      marketsCacheTime = Date.now();
      setMarkets(results);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load markets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const refresh = useCallback(() => fetchMarkets(true), [fetchMarkets]);

  return { markets, loading, error, refresh };
}

// ── Hook: single market detail ──────────────────────────────────
export function useMarketDetail(marketId: number) {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchOneMarket(marketId);
      setMarket(result);
    } catch {
      /* keep existing state */
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { market, loading, refresh: fetch };
}

// ── Hook: user positions (parallel) ─────────────────────────────
export function usePositions() {
  const { address } = useWallet();
  const [positions, setPositions] = useState<
    { marketId: number; question: string; outcome: number; shares: bigint; resolved: boolean; winningOutcome: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!address) {
      setPositions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const count: bigint = await readMarketContract.marketCount();
      const n = Number(count);

      // Fetch all market info + positions in parallel
      const marketPromises = Array.from({ length: n }, (_, i) =>
        Promise.all([
          readMarketContract.getMarket(i),
          readMarketContract.positions(address, i, 0),
          readMarketContract.positions(address, i, 1),
        ]).then(([[question, , , resolved, winningOutcome], yesShares, noShares]) => {
          const items: typeof positions = [];
          if (yesShares > 0n) items.push({ marketId: i, question, outcome: 0, shares: yesShares, resolved, winningOutcome: Number(winningOutcome) });
          if (noShares > 0n) items.push({ marketId: i, question, outcome: 1, shares: noShares, resolved, winningOutcome: Number(winningOutcome) });
          return items;
        })
      );

      const results = await Promise.all(marketPromises);
      setPositions(results.flat());
    } catch {
      /* keep existing */
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { positions, loading, refresh: fetch };
}

// ── Hook: user stats + pending reward (parallel) ────────────────
export function useUserStats() {
  const { address } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pendingReward, setPendingReward] = useState<bigint>(0n);
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // All 3 calls in parallel
      const [statsResult, reward, bal] = await Promise.all([
        readMarketContract.getUserStats(address),
        readMarketContract.getPendingReward(address),
        readTokenContract.balanceOf(address),
      ]);

      const [wins, losses, totalWon, totalLost] = statsResult;
      setStats({
        wins: Number(wins),
        losses: Number(losses),
        totalWon,
        totalLost,
      });
      setPendingReward(reward);
      setBalance(bal);
    } catch {
      /* keep existing */
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, pendingReward, balance, loading, refresh: fetch };
}

// ── Hook: write transactions (local wallet — no popups) ─────────
export function usePredictionTx() {
  const { wallet, address } = useWallet();
  const [pending, setPending] = useState(false);

  const buyOutcome = useCallback(
    async (marketId: number, outcome: 0 | 1, amountTFY: string) => {
      if (!wallet) throw new Error('Wallet not connected');
      console.log('[TX] buyOutcome start — wallet:', address, 'market:', marketId, 'outcome:', outcome, 'amount:', amountTFY);
      setPending(true);
      try {
        const amountWei = parseUnits(amountTFY, 18);

        // Check + approve collateral
        const token = new Contract(COLLATERAL_ADDRESS, ERC20_ABI, wallet);
        const allowance: bigint = await token.allowance(address, PREDICTION_MARKET_ADDRESS);
        console.log('[TX] Current allowance:', allowance.toString());
        if (allowance < amountWei) {
          console.log('[TX] Approving TFY...');
          const approveTx = await token.approve(PREDICTION_MARKET_ADDRESS, MaxUint256);
          console.log('[TX] Approve tx sent:', approveTx.hash);
          await approveTx.wait();
          console.log('[TX] Approve confirmed');
        }

        const market = new Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, wallet);
        console.log('[TX] Sending buyOutcome tx...');
        const tx = await market.buyOutcome(marketId, outcome, amountWei, 0);
        console.log('[TX] Buy tx sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('[TX] Buy confirmed! Block:', receipt?.blockNumber);
        marketsCacheTime = 0;
        return receipt;
      } catch (e: any) {
        console.error('[TX] buyOutcome FAILED:', e.reason || e.message || e);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [wallet, address],
  );

  const redeem = useCallback(async () => {
    if (!wallet) throw new Error('Wallet not connected');
    setPending(true);
    try {
      const market = new Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, wallet);
      const tx = await market.redeem();
      return await tx.wait();
    } finally {
      setPending(false);
    }
  }, [wallet]);

  const sellOutcome = useCallback(
    async (marketId: number, outcome: 0 | 1, sharesWei: bigint) => {
      if (!wallet) throw new Error('Wallet not connected');
      setPending(true);
      try {
        const market = new Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, wallet);
        const tx = await market.sellOutcome(marketId, outcome, sharesWei, 0);
        const receipt = await tx.wait();
        marketsCacheTime = 0;
        return receipt;
      } finally {
        setPending(false);
      }
    },
    [wallet],
  );

  return { buyOutcome, sellOutcome, redeem, pending };
}
