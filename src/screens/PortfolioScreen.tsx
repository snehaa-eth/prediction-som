import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatUnits } from 'ethers';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { usePositions, useUserStats, usePredictionTx } from '../hooks/useContract';

const MAX_CONTENT_WIDTH = 600;

export const PortfolioScreen: React.FC = () => {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const { positions, loading: posLoading, refresh: refreshPositions } = usePositions();
  const { balance, pendingReward, stats, loading: statsLoading, refresh: refreshStats } = useUserStats();
  const { redeem, sellOutcome, pending } = usePredictionTx();

  const openPositions = positions.filter(p => !p.resolved);
  const resolvedPositions = positions.filter(p => p.resolved);
  const data = tab === 'open' ? openPositions : resolvedPositions;

  const balanceDisplay = Number(formatUnits(balance, 18)).toFixed(2);
  const pendingDisplay = Number(formatUnits(pendingReward, 18)).toFixed(2);
  const winRate = stats && (stats.wins + stats.losses) > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  const handleRedeem = async () => {
    try {
      await redeem();
      refreshStats();
      refreshPositions();
    } catch { /* */ }
  };

  const handleSell = async (item: typeof positions[0]) => {
    const doSell = async () => {
      try {
        await sellOutcome(item.marketId, item.outcome as 0 | 1, item.shares);
        refreshPositions();
        refreshStats();
      } catch (e: any) {
        const msg = e.message?.slice(0, 80) ?? 'Failed';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Sell Failed', msg);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Sell ${Number(formatUnits(item.shares, 18)).toFixed(1)} TFY shares?`)) doSell();
    } else {
      Alert.alert('Sell Shares', `Sell ${Number(formatUnits(item.shares, 18)).toFixed(1)} TFY shares?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sell', style: 'destructive', onPress: doSell },
      ]);
    }
  };

  const renderPosition = ({ item }: { item: typeof positions[0] }) => {
    const prediction = item.outcome === 0 ? 'YES' : 'NO';
    const sharesDisplay = Number(formatUnits(item.shares, 18)).toFixed(2);
    const won = item.resolved && item.winningOutcome === item.outcome;

    return (
      <View style={[styles.positionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {/* Gold accent line */}
        <View style={[styles.cardAccent, { backgroundColor: prediction === 'YES' ? theme.accent : theme.textSecondary }]} />

        <View style={styles.positionTop}>
          <Text style={[styles.positionQuestion, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.question}
          </Text>
          <View style={[styles.predBadge, {
            backgroundColor: prediction === 'YES' ? 'rgba(196,149,106,0.10)' : 'rgba(232,85,109,0.10)',
          }]}>
            <Text style={[styles.predBadgeText, {
              color: prediction === 'YES' ? theme.accent : theme.loss,
            }]}>{prediction}</Text>
          </View>
        </View>

        <View style={styles.positionBottom}>
          <View>
            <Text style={[styles.posLabel, { color: theme.textSecondary }]}>Shares</Text>
            <Text style={[styles.posValue, { color: theme.textPrimary }]}>{sharesDisplay}</Text>
          </View>
          <View>
            <Text style={[styles.posLabel, { color: theme.textSecondary }]}>Market</Text>
            <Text style={[styles.posValue, { color: theme.textPrimary }]}>#{item.marketId}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.posLabel, { color: theme.textSecondary }]}>Status</Text>
            <Text style={[styles.posValue, { color: item.resolved ? (won ? theme.profit : theme.loss) : theme.accent }]}>
              {item.resolved ? (won ? 'Won' : 'Lost') : 'Active'}
            </Text>
          </View>
        </View>

        {/* Sell button for open positions */}
        {!item.resolved && (
          <Pressable
            style={[styles.sellButton, { borderColor: theme.loss }]}
            onPress={() => handleSell(item)}
            disabled={pending}>
            <Text style={[styles.sellButtonText, { color: theme.loss }]}>
              {pending ? 'Selling...' : 'Sell Position'}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  const loading = posLoading || statsLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        <FlatList
          data={data}
          keyExtractor={(item, i) => `${item.marketId}-${item.outcome}-${i}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.titleRow}>
                <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Portfolio</Text>
                <Pressable
                  style={[styles.refreshBtn, { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent, borderWidth: 1 }]}
                  onPress={() => { refreshPositions(); refreshStats(); }}>
                  <Text style={[styles.refreshText, { color: theme.accent }]}>
                    {loading ? '...' : '↻ Refresh'}
                  </Text>
                </Pressable>
              </View>

              {loading && <ActivityIndicator size="small" color={theme.accent} style={{ marginBottom: 20 }} />}

              {/* Balance cards */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>TFY Balance</Text>
                  <Text style={[styles.summaryValue, { color: theme.accent }]}>{balanceDisplay}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Win Rate</Text>
                  <Text style={[styles.summaryValue, { color: theme.profit }]}>{winRate}%</Text>
                </View>
              </View>

              {/* Pending reward banner */}
              {pendingReward > 0n && (
                <Pressable
                  style={[styles.redeemBanner, { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent }]}
                  onPress={handleRedeem}
                  disabled={pending}>
                  <View>
                    <Text style={[styles.redeemLabel, { color: theme.textSecondary }]}>Pending Reward</Text>
                    <Text style={[styles.redeemValue, { color: theme.accent }]}>{pendingDisplay} TFY</Text>
                  </View>
                  <View style={[styles.redeemBtn, { backgroundColor: theme.accent }]}>
                    <Text style={[styles.redeemBtnText, { color: '#0A0A0A' }]}>
                      {pending ? '...' : 'Claim'}
                    </Text>
                  </View>
                </Pressable>
              )}

              <View style={styles.tabRow}>
                {(['open', 'resolved'] as const).map(t => (
                  <Pressable
                    key={t}
                    style={[styles.tab, { backgroundColor: theme.cardBg, borderColor: theme.border },
                      tab === t && { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent }]}
                    onPress={() => setTab(t)}>
                    <Text style={[styles.tabText, { color: theme.textSecondary },
                      tab === t && { color: theme.accent, fontWeight: '600' }]}>
                      {t === 'open' ? `Open (${openPositions.length})` : `Resolved (${resolvedPositions.length})`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {data.length === 0 && !loading && (
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                    {tab === 'open' ? 'No open positions. Start trading!' : 'No resolved positions yet.'}
                  </Text>
                </View>
              )}
            </>
          }
          renderItem={renderPosition}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  refreshBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  refreshText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: radii.card, padding: 18, borderWidth: 1 },
  summaryLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8, letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  redeemBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radii.card, padding: 16, marginBottom: 16, borderWidth: 1 },
  redeemLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  redeemValue: { fontSize: 18, fontWeight: '800' },
  redeemBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  redeemBtnText: { fontSize: 14, fontWeight: '700' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: radii.button, alignItems: 'center', borderWidth: 1, cursor: 'pointer' as any },
  tabText: { fontSize: 13, fontWeight: '500' },
  positionCard: { borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  positionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  positionQuestion: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  predBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  predBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  positionBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  posLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  posValue: { fontSize: 14, fontWeight: '700' },
  sellButton: { marginTop: 14, height: 40, borderRadius: 20, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  sellButtonText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});
