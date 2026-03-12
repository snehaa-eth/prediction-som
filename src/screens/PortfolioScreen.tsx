import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { openPositions, resolvedPositions, userProfile } from '../data/mockData';
import { Position } from '../types';

const MAX_CONTENT_WIDTH = 600;

export const PortfolioScreen: React.FC = () => {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const data = tab === 'open' ? openPositions : resolvedPositions;
  const totalPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);

  const renderPosition = ({ item, index }: { item: Position; index: number }) => (
    <View>
      <View style={[styles.positionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.positionTop}>
          <Text style={[styles.positionQuestion, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.question}
          </Text>
          <View
            style={[
              styles.predBadge,
              {
                backgroundColor:
                  item.prediction === 'YES' ? theme.accentDim : 'rgba(248,113,113,0.12)',
              },
            ]}>
            <Text
              style={[
                styles.predBadgeText,
                { color: item.prediction === 'YES' ? theme.profit : theme.loss },
              ]}>
              {item.prediction}
            </Text>
          </View>
        </View>
        <View style={styles.positionBottom}>
          <View>
            <Text style={[styles.posLabel, { color: theme.textSecondary }]}>Amount</Text>
            <Text style={[styles.posValue, { color: theme.textPrimary }]}>${item.amount}</Text>
          </View>
          <View>
            <Text style={[styles.posLabel, { color: theme.textSecondary }]}>Current</Text>
            <Text style={[styles.posValue, { color: theme.textPrimary }]}>${item.currentValue}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.posLabel, { color: theme.textSecondary }]}>P&L</Text>
            <Text
              style={[styles.posValue, { color: item.pnl >= 0 ? theme.profit : theme.loss }]}>
              {item.pnl >= 0 ? '+' : ''}${item.pnl} ({item.pnlPercent}%)
            </Text>
          </View>
        </View>
        {item.resolved && item.pnl > 0 && (
          <Pressable style={[styles.claimButton, { backgroundColor: theme.accent }]}>
            <Text style={styles.claimButtonText}>Claim Rewards</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Portfolio</Text>

              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Balance</Text>
                  <Text style={[styles.summaryValue, { color: theme.accent }]}>
                    ${userProfile.balance.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total P&L</Text>
                  <Text
                    style={[styles.summaryValue, { color: totalPnl >= 0 ? theme.profit : theme.loss }]}>
                    {totalPnl >= 0 ? '+' : ''}${totalPnl}
                  </Text>
                </View>
              </View>

              <View style={styles.tabRow}>
                <Pressable
                  style={[
                    styles.tab,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                    tab === 'open' && { backgroundColor: theme.accentDim, borderColor: theme.accent },
                  ]}
                  onPress={() => setTab('open')}>
                  <Text style={[
                    styles.tabText,
                    { color: theme.textSecondary },
                    tab === 'open' && { color: theme.accent, fontWeight: '600' },
                  ]}>
                    Open ({openPositions.length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.tab,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                    tab === 'resolved' && { backgroundColor: theme.accentDim, borderColor: theme.accent },
                  ]}
                  onPress={() => setTab('resolved')}>
                  <Text style={[
                    styles.tabText,
                    { color: theme.textSecondary },
                    tab === 'resolved' && { color: theme.accent, fontWeight: '600' },
                  ]}>
                    Resolved ({resolvedPositions.length})
                  </Text>
                </Pressable>
              </View>
            </>
          }
          renderItem={renderPosition}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.button,
    alignItems: 'center',
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  positionCard: {
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  positionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  positionQuestion: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  predBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  predBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  positionBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  posLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  posValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  claimButton: {
    marginTop: 14,
    height: 40,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
