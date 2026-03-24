import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Market } from '../types';

interface Props {
  market: Market;
  onPress: (market: Market) => void;
}

export const MarketCard: React.FC<Props> = ({ market, onPress }) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.975, stiffness: 300, damping: 20, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, stiffness: 300, damping: 20, useNativeDriver: true }).start();
  }, [scale]);

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const isResolved = market.timeLeft === 'Resolved';

  return (
    <AnimatedPressable
      style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, transform: [{ scale }] }]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(market)}>
      <View style={styles.topRow}>
        <View style={[styles.tag, { backgroundColor: 'rgba(196,149,106,0.08)' }]}>
          <Text style={[styles.tagText, { color: theme.accent }]}>{market.category}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isResolved ? theme.loss : theme.profit }]} />
        <Text style={[styles.timeLeft, { color: isResolved ? theme.loss : theme.textSecondary }]}>{market.timeLeft}</Text>
      </View>

      <Text style={[styles.question, { color: theme.textPrimary }]} numberOfLines={2}>
        {market.question}
      </Text>

      {/* Probability bar */}
      <View style={[styles.probBarOuter, { backgroundColor: theme.glass }]}>
        <View style={[styles.probBarInner, { width: `${market.yesProb}%`, backgroundColor: theme.accent }]} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.probContainer}>
          <Text style={[styles.probValue, { color: theme.accent }]}>
            {market.yesProb}%
            <Text style={styles.probLabel}> YES</Text>
          </Text>
          <Text style={[styles.separator, { color: theme.border }]}>|</Text>
          <Text style={[styles.probValue, { color: theme.textSecondary }]}>
            {market.noProb}%
            <Text style={styles.probLabel}> NO</Text>
          </Text>
        </View>
        <Text style={[styles.volume, { color: theme.textSecondary }]}>{market.volume}</Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: { minHeight: 140, borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 'auto' },
  timeLeft: { fontSize: 11, fontWeight: '500' },
  question: { fontSize: 16, fontWeight: '600', lineHeight: 22, flex: 1, marginBottom: 12 },
  probBarOuter: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  probBarInner: { height: '100%', borderRadius: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  probContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  probValue: { fontSize: 14, fontWeight: '700' },
  probLabel: { fontSize: 12, fontWeight: '500' },
  separator: { fontSize: 14 },
  volume: { fontSize: 12, fontWeight: '500' },
});
