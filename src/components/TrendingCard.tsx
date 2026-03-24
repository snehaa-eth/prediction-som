import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Market } from '../types';

interface Props {
  market: Market;
  onPress: (market: Market) => void;
}

export const TrendingCard: React.FC<Props> = ({ market, onPress }) => {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
      onPress={() => onPress(market)}>
      <View style={styles.overlay}>
        {/* Gold accent line at top */}
        <View style={[styles.accentLine, { backgroundColor: theme.accent }]} />

        <View style={styles.topRow}>
          <View style={[styles.topBadge, { backgroundColor: 'rgba(196,149,106,0.10)' }]}>
            <Text style={[styles.badgeText, { color: theme.accent }]}>LIVE</Text>
          </View>
          <Text style={[styles.marketId, { color: theme.textSecondary }]}>#{market.id}</Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
            {market.question}
          </Text>
          <View style={styles.bottomInfo}>
            <Text style={[styles.prob, { color: theme.accent }]}>{market.yesProb}% YES</Text>
            <Text style={[styles.volume, { color: theme.textSecondary }]}>{market.volume}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { width: 260, height: 160, borderRadius: radii.lg, marginRight: 12, borderWidth: 1, overflow: 'hidden' },
  overlay: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  accentLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  marketId: { fontSize: 11, fontWeight: '500' },
  content: { flex: 1, justifyContent: 'flex-end' },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 8, lineHeight: 19 },
  bottomInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  prob: { fontSize: 12, fontWeight: '700' },
  volume: { fontSize: 11, fontWeight: '500' },
});
