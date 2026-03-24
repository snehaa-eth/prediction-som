import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { PREDICTION_MARKET_ABI } from '../lib/contracts/abi';
import { PREDICTION_MARKET_ADDRESS, RPC_URL } from '../lib/config';

const MAX_CONTENT_WIDTH = 600;
const BATCH_SIZE = 20; // fetch addresses in batches of 20

interface LeaderEntry {
  address: string;
  wins: number;
  losses: number;
  totalWon: bigint;
  score: number;
}

// ── Cache ───────────────────────────────────────────────────────
let leaderCache: LeaderEntry[] = [];
let leaderCacheTime = 0;
const CACHE_TTL = 60_000; // 60s

const provider = new JsonRpcProvider(RPC_URL);
const contract = new Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, provider);

export const LeaderboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { address: myAddress } = useWallet();
  const [entries, setEntries] = useState<LeaderEntry[]>(leaderCache);
  const [loading, setLoading] = useState(leaderCache.length === 0);

  const fetchLeaderboard = useCallback(async (force = false) => {
    if (!force && leaderCache.length > 0 && Date.now() - leaderCacheTime < CACHE_TTL) {
      setEntries(leaderCache);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const traderCount: bigint = await contract.getTraderCount();
      const n = Math.min(Number(traderCount), 200);

      // Fetch all addresses in parallel batches
      const addrPromises = Array.from({ length: n }, (_, i) => contract.getTraderByIndex(i));
      const allAddrs: string[] = await Promise.all(addrPromises);

      // Deduplicate
      const seen = new Set<string>();
      const uniqueAddrs: string[] = [];
      for (const addr of allAddrs) {
        const lower = addr.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          uniqueAddrs.push(addr);
        }
      }

      // Fetch all stats in parallel
      const statsPromises = uniqueAddrs.map(addr =>
        contract.getUserStats(addr).then(([wins, losses, totalWon]: [bigint, bigint, bigint, bigint]) => ({
          address: addr,
          wins: Number(wins),
          losses: Number(losses),
          totalWon,
          score: Number(wins) - Number(losses),
        }))
      );
      const items = await Promise.all(statsPromises);

      items.sort((a, b) => b.score - a.score || Number(b.totalWon - a.totalWon));
      leaderCache = items;
      leaderCacheTime = Date.now();
      setEntries(items);
    } catch {
      /* keep existing */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const refresh = useCallback(() => fetchLeaderboard(true), [fetchLeaderboard]);

  const getRankBadge = (rank: number) => {
    if (rank === 0) return { text: '1st', bg: '#C4956A', color: '#0A0A0A' };
    if (rank === 1) return { text: '2nd', bg: '#C0C0C0', color: '#1A1A1A' };
    if (rank === 2) return { text: '3rd', bg: '#CD7F32', color: '#FFFFFF' };
    return { text: `#${rank + 1}`, bg: theme.glass, color: theme.textSecondary };
  };

  const renderItem = ({ item, index }: { item: LeaderEntry; index: number }) => {
    const short = `${item.address.slice(0, 6)}...${item.address.slice(-4)}`;
    const isMe = myAddress && item.address.toLowerCase() === myAddress.toLowerCase();
    const badge = getRankBadge(index);
    const wonDisplay = Number(formatUnits(item.totalWon, 18)).toFixed(0);

    return (
      <View style={[styles.row, {
        backgroundColor: isMe ? 'rgba(196,149,106,0.06)' : theme.cardBg,
        borderColor: isMe ? theme.accent : theme.border,
        borderWidth: isMe ? 1.5 : 1,
      }]}>
        <View style={[styles.rankBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.rankText, { color: badge.color }]}>{badge.text}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.address, { color: theme.textPrimary }]}>
            {short} {isMe ? '(You)' : ''}
          </Text>
          <Text style={[styles.stats, { color: theme.textSecondary }]}>
            {item.wins}W / {item.losses}L
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.wonValue, { color: theme.accent }]}>{wonDisplay}</Text>
          <Text style={[styles.wonLabel, { color: theme.textSecondary }]}>TFY won</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        <FlatList
          data={entries}
          keyExtractor={item => item.address}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Leaderboard</Text>
                <Pressable
                  onPress={refresh}
                  style={[styles.refreshBtn, { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent, borderWidth: 1 }]}>
                  <Text style={[styles.refreshText, { color: theme.accent }]}>
                    {loading ? '...' : '↻ Refresh'}
                  </Text>
                </Pressable>
              </View>
              {loading && <ActivityIndicator size="small" color={theme.accent} style={{ marginBottom: 20 }} />}
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ color: theme.accent, fontSize: 40, marginBottom: 8 }}>★</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>No traders yet. Be the first!</Text>
              </View>
            ) : null
          }
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  refreshBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  refreshText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radii.card, marginBottom: 8 },
  rankBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 13, fontWeight: '800' },
  info: { flex: 1 },
  address: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  stats: { fontSize: 12, fontWeight: '500' },
  right: { alignItems: 'flex-end' },
  wonValue: { fontSize: 16, fontWeight: '800' },
  wonLabel: { fontSize: 10, fontWeight: '500' },
});
