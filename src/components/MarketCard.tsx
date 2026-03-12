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
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.98,
        stiffness: 300,
        damping: 20,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: -3,
        stiffness: 300,
        damping: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, translateY]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 300,
        damping: 20,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        stiffness: 300,
        damping: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, translateY]);

  const animatedStyle = {
    transform: [{ scale }, { translateY }],
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(market)}>
      <View style={styles.topRow}>
        <View style={[styles.tag, { backgroundColor: theme.border }]}>
          <Text style={[styles.tagText, { color: theme.textSecondary }]}>{market.category}</Text>
        </View>
        <Text style={[styles.timeLeft, { color: theme.textSecondary }]}>{market.timeLeft}</Text>
      </View>

      <Text style={[styles.question, { color: theme.textPrimary }]} numberOfLines={2}>
        {market.question}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.probContainer}>
          <View style={styles.probItem}>
            <Text style={[styles.probLabel, { color: theme.accent }]}>YES</Text>
            <Text style={[styles.probValue, { color: theme.accent }]}>
              {market.yesProb}%
            </Text>
          </View>
          <View style={styles.probItem}>
            <Text style={[styles.probLabel, { color: theme.purple }]}>NO</Text>
            <Text style={[styles.probValue, { color: theme.purple }]}>
              {market.noProb}%
            </Text>
          </View>
        </View>
        <Text style={[styles.volume, { color: theme.textSecondary }]}>{market.volume} vol</Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timeLeft: {
    fontSize: 11,
    fontWeight: '500',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  probContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  probItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  probLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  probValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  volume: {
    fontSize: 13,
    fontWeight: '500',
  },
});
