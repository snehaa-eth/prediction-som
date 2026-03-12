import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Market } from '../types';
import { PriceChart } from '../components/PriceChart';
import { SwipeTradeCard } from '../components/SwipeTradeCard';
import { ConfirmationSheet } from '../components/ConfirmationSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

interface Props {
  route: any;
  navigation: any;
}

export const MarketDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { market } = route.params as { market: Market };
  const [amount, setAmount] = useState(125);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<'YES' | 'NO'>('YES');

  const handleSwipe = useCallback((direction: 'YES' | 'NO') => {
    setPendingPrediction(direction);
    setShowConfirmation(true);
  }, []);

  const estimatedPayout =
    pendingPrediction === 'YES'
      ? amount / (market.yesProb / 100)
      : amount / (market.noProb / 100);

  const handleConfirm = () => {
    setShowConfirmation(false);
    if (Platform.OS === 'web') {
      window.alert(`Trade Placed! You predicted ${pendingPrediction} with $${amount}`);
    } else {
      Alert.alert('Trade Placed!', `You predicted ${pendingPrediction} with $${amount}`);
    }
  };

  const chartWidth = Math.min(SCREEN_WIDTH - 32, MAX_CONTENT_WIDTH - 32);
  const amountOptions = [25, 50, 100, 250, 500, 1000];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.centered}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.backText, { color: theme.textPrimary }]}>←</Text>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable style={[styles.iconBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.iconText, { color: theme.textPrimary }]}>♡</Text>
              </Pressable>
              <Pressable style={[styles.iconBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.iconText, { color: theme.textPrimary }]}>↗</Text>
              </Pressable>
            </View>
          </View>

          {/* Category */}
          <View>
            <View style={[styles.tag, { backgroundColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>{market.category}</Text>
            </View>
          </View>

          {/* Question */}
          <View>
            <Text style={[styles.question, { color: theme.textPrimary }]}>{market.question}</Text>
          </View>

          {/* Probability Display */}
          <View style={[styles.probRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.probBox}>
              <Text style={[styles.probLabel, { color: theme.yes }]}>YES</Text>
              <Text style={[styles.probValue, { color: theme.yes }]}>{market.yesProb}%</Text>
            </View>
            <View style={[styles.probDivider, { backgroundColor: theme.border }]} />
            <View style={styles.probBox}>
              <Text style={[styles.probLabel, { color: theme.no }]}>NO</Text>
              <Text style={[styles.probValue, { color: theme.no }]}>{market.noProb}%</Text>
            </View>
          </View>

          {/* Chart */}
          <View>
            <Text style={[styles.chartLabel, { color: theme.textSecondary }]}>Probability History</Text>
            <PriceChart data={market.priceHistory} width={chartWidth} height={200} />
          </View>

          {/* Market Info */}
          <View style={styles.infoRow}>
            <View style={[styles.infoItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Volume</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{market.volume}</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Liquidity</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{market.liquidity}</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Ends</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{market.timeLeft}</Text>
            </View>
          </View>

          {/* Amount Selector */}
          <View>
            <Text style={[styles.amountTitle, { color: theme.textSecondary }]}>Select Amount</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.amountRow}>
              {amountOptions.map(opt => (
                <Pressable
                  key={opt}
                  style={[
                    styles.amountChip,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                    amount === opt && { backgroundColor: theme.accentDim, borderColor: theme.accent },
                  ]}
                  onPress={() => setAmount(opt)}>
                  <Text
                    style={[
                      styles.amountChipText,
                      { color: theme.textSecondary },
                      amount === opt && { color: theme.accent, fontWeight: '600' },
                    ]}>
                    ${opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Swipe Trade */}
          <View style={styles.tradeSection}>
            <Text style={[styles.tradeTitle, { color: theme.accent }]}>Swipe to Predict</Text>
            <SwipeTradeCard
              amount={amount}
              yesProb={market.yesProb}
              noProb={market.noProb}
              question={market.question}
              onSwipeComplete={handleSwipe}
            />
          </View>
        </View>
      </ScrollView>

      <ConfirmationSheet
        visible={showConfirmation}
        prediction={pendingPrediction}
        amount={amount}
        estimatedPayout={estimatedPayout}
        onConfirm={handleConfirm}
        onClose={() => setShowConfirmation(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  backText: {
    fontSize: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  iconText: {
    fontSize: 18,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginBottom: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 30,
  },
  probRow: {
    flexDirection: 'row',
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  probBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  probLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  probValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  probDivider: {
    width: 1,
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 24,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    borderRadius: radii.button,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  amountRow: {
    gap: 8,
    paddingBottom: 4,
  },
  amountChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  amountChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tradeSection: {
    marginTop: 24,
  },
  tradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
