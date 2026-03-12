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
        <View style={[styles.topBadge, { backgroundColor: theme.accentDim }]}>
          <Text style={[styles.badgeText, { color: theme.accent }]}>Trending</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
            {market.question}
          </Text>
          <View style={styles.bottomInfo}>
            <Text style={[styles.volume, { color: theme.accent }]}>{market.volume} vol</Text>
            <Text style={[styles.time, { color: theme.textSecondary }]}>{market.timeLeft}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 160,
    borderRadius: radii.lg,
    marginRight: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  topBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volume: {
    fontSize: 11,
    fontWeight: '500',
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
});
