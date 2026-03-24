import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { PREDICTION_MARKET_ABI } from '../lib/contracts/abi';
import { PREDICTION_MARKET_ADDRESS, RPC_URL } from '../lib/config';
import type { AppTheme } from '../theme';

const MAX_CONTENT_WIDTH = 600;

interface ActivityItem {
  id: string;
  type: 'buy' | 'sell' | 'redeem';
  marketId: number;
  amount: string;
  outcome?: number;
  blockNumber: number;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'buy': return '↗';
    case 'sell': return '↙';
    case 'redeem': return '◆';
  }
};

const getActivityColor = (type: ActivityItem['type'], theme: AppTheme) => {
  switch (type) {
    case 'buy': return theme.accent;
    case 'sell': return theme.profit;
    case 'redeem': return theme.accent;
  }
};

const getActivityLabel = (item: ActivityItem) => {
  switch (item.type) {
    case 'buy': return `Bought ${item.outcome === 0 ? 'YES' : 'NO'}`;
    case 'sell': return `Sold ${item.outcome === 0 ? 'YES' : 'NO'}`;
    case 'redeem': return 'Redeemed';
  }
};

export const ActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const { address } = useWallet();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!address) { setActivities([]); setLoading(false); return; }
    try {
      setLoading(true);
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI, provider);

      const [boughtLogs, soldLogs, redeemLogs] = await Promise.all([
        contract.queryFilter(contract.filters.Bought(), -10000).catch(() => []),
        contract.queryFilter(contract.filters.Sold(), -10000).catch(() => []),
        contract.queryFilter(contract.filters.Redeemed(address), -10000).catch(() => []),
      ]);

      const items: ActivityItem[] = [];

      for (const log of boughtLogs) {
        const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!parsed) continue;
        if (parsed.args[4].toLowerCase() !== address.toLowerCase()) continue;
        items.push({ id: `buy-${log.transactionHash}-${log.index}`, type: 'buy', marketId: Number(parsed.args[0]), outcome: Number(parsed.args[1]), amount: formatUnits(parsed.args[2], 18), blockNumber: log.blockNumber });
      }
      for (const log of soldLogs) {
        const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!parsed) continue;
        if (parsed.args[4].toLowerCase() !== address.toLowerCase()) continue;
        items.push({ id: `sell-${log.transactionHash}-${log.index}`, type: 'sell', marketId: Number(parsed.args[0]), outcome: Number(parsed.args[1]), amount: formatUnits(parsed.args[3], 18), blockNumber: log.blockNumber });
      }
      for (const log of redeemLogs) {
        const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        if (!parsed) continue;
        items.push({ id: `redeem-${log.transactionHash}-${log.index}`, type: 'redeem', marketId: 0, amount: formatUnits(parsed.args[1], 18), blockNumber: log.blockNumber });
      }

      items.sort((a, b) => b.blockNumber - a.blockNumber);
      setActivities(items);
    } catch { /* */ } finally { setLoading(false); }
  }, [address]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const renderItem = ({ item }: { item: ActivityItem }) => {
    const iconColor = getActivityColor(item.type, theme);
    const amountNum = Number(item.amount).toFixed(1);
    return (
      <View style={[styles.activityItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          <Text style={[styles.icon, { color: iconColor }]}>{getActivityIcon(item.type)}</Text>
        </View>
        <View style={styles.activityInfo}>
          <Text style={[styles.activityMarket, { color: theme.textPrimary }]}>Market #{item.marketId}</Text>
          <Text style={[styles.activityLabel, { color: theme.textSecondary }]}>{getActivityLabel(item)}</Text>
        </View>
        <View style={styles.activityRight}>
          <Text style={[styles.activityAmount, { color: item.type === 'sell' ? theme.profit : theme.textPrimary }]}>
            {amountNum} TFY
          </Text>
          <Text style={[styles.activityTime, { color: theme.textSecondary }]}>Block {item.blockNumber}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        <FlatList
          data={activities}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Activity</Text>
              {loading && <ActivityIndicator size="small" color={theme.accent} style={{ marginBottom: 16 }} />}
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ color: theme.accent, fontSize: 40, marginBottom: 8 }}>↻</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>No activity yet. Start trading!</Text>
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
  screenTitle: { fontSize: 28, fontWeight: '700', marginBottom: 20, letterSpacing: -0.5 },
  activityItem: { flexDirection: 'row', alignItems: 'center', height: 72, borderRadius: radii.button, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 18, fontWeight: '700' },
  activityInfo: { flex: 1 },
  activityMarket: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  activityLabel: { fontSize: 11, fontWeight: '500' },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  activityTime: { fontSize: 10, fontWeight: '500' },
});
