import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Pressable, ScrollView, Platform, Alert,
  Animated, PanResponder, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { radii } from '../theme';
import { allMarkets } from '../data/mockData';
import { ConfirmationSheet } from '../components/ConfirmationSheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.56, 500);
const SWIPE_THRESHOLD = 100;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;

const categoryIcons: Record<string, string> = { Crypto: '₿', Politics: '🏛', Sports: '⚽', Tech: '🚀', Global: '🌍' };

export const PredictScreen: React.FC = () => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [amount, setAmount] = useState(100);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<'YES' | 'NO'>('YES');

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const market = allMarkets[currentIndex % allMarkets.length];

  const goToNext = useCallback(() => setCurrentIndex(p => p + 1), []);
  const resetCard = useCallback(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [translateX, translateY, cardOpacity]);

  const handleSwipeComplete = useCallback((dir: 'YES' | 'NO') => {
    setPendingPrediction(dir); setShowConfirmation(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowConfirmation(false); goToNext(); resetCard();
    Platform.OS === 'web'
      ? window.alert(`Trade Placed! ${pendingPrediction} with $${amount}`)
      : Alert.alert('Trade Placed!', `${pendingPrediction} with $${amount}`);
  }, [pendingPrediction, amount, goToNext, resetCard]);

  const flyCard = useCallback((dir: 'YES' | 'NO') => {
    const flyX = dir === 'YES' ? FLY_OUT_X : -FLY_OUT_X;
    Animated.parallel([
      Animated.timing(translateX, { toValue: flyX, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    handleSwipeComplete(dir);
  }, [handleSwipeComplete, translateX, cardOpacity]);

  const estimatedPayout = pendingPrediction === 'YES'
    ? amount / (market.yesProb / 100) : amount / (market.noProb / 100);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 10,
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => {
        translateX.setValue(gs.dx);
        translateY.setValue(gs.dy * 0.25);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: FLY_OUT_X, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
          handleSwipeComplete('YES');
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: -FLY_OUT_X, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
          handleSwipeComplete('NO');
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, stiffness: 200, damping: 20, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, stiffness: 200, damping: 20, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  const rotation = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-18deg', '0deg', '18deg'],
    extrapolate: 'clamp',
  });

  const yesStampOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
    outputRange: [0, 0.4, 1],
    extrapolate: 'clamp',
  });
  const yesStampScale = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0.5, 1.1],
    extrapolate: 'clamp',
  });

  const noStampOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });
  const noStampScale = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1.1, 0.5],
    extrapolate: 'clamp',
  });

  const yesGlowOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 0.6],
    extrapolate: 'clamp',
  });
  const noGlowOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [0.6, 0],
    extrapolate: 'clamp',
  });

  const cardStyle = {
    opacity: cardOpacity,
    transform: [
      { translateX },
      { translateY },
      { rotate: rotation },
    ],
  };

  const amountOptions = [25, 50, 100, 250, 500];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Predict</Text>
        <View style={[styles.balancePill, { backgroundColor: theme.accentDim, borderColor: theme.accentGlow }]}>
          <Text style={[styles.balanceText, { color: theme.accent }]}>$4,250</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Card inside ScrollView so it scrolls with page — PanResponder captures horizontal gestures */}
        <View style={styles.cardContainer}>
          <Animated.View
            key={currentIndex}
            {...panResponder.panHandlers}
            style={[styles.card, cardStyle, {
              backgroundColor: theme.mode === 'dark' ? '#1E0C2E' : '#F0F0F5',
              shadowColor: theme.shadow,
            }]}>
            <View style={styles.categoryIconBg}>
              <Text style={styles.categoryEmoji}>{categoryIcons[market.category] || '📊'}</Text>
            </View>

            <Animated.View style={[styles.glowEdge, styles.glowLeft, { backgroundColor: theme.noGlow, opacity: noGlowOpacity }]} />
            <Animated.View style={[styles.glowEdge, styles.glowRight, { backgroundColor: theme.yesGlow, opacity: yesGlowOpacity }]} />

            <Animated.View style={[styles.stamp, styles.yesStamp, { borderColor: theme.accent, backgroundColor: theme.yesBg, opacity: yesStampOpacity, transform: [{ scale: yesStampScale }, { rotate: '-15deg' }] }]}>
              <Text style={[styles.yesStampText, { color: theme.accent }]}>YES</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.noStamp, { borderColor: theme.no, backgroundColor: theme.noBg, opacity: noStampOpacity, transform: [{ scale: noStampScale }, { rotate: '15deg' }] }]}>
              <Text style={[styles.noStampText, { color: theme.no }]}>NOPE</Text>
            </Animated.View>

            <View style={[styles.bottomGradient, Platform.OS === 'web'
              ? { background: `linear-gradient(to top, ${theme.cardGradientEnd} 0%, ${theme.cardGradientMid} 50%, transparent 100%)` as any }
              : { backgroundColor: theme.mode === 'dark' ? 'rgba(13,0,17,0.6)' : 'rgba(255,255,255,0.7)' }
            ]} />

            <View style={styles.cardContent}>
              <View style={[styles.categoryTag, { backgroundColor: theme.accent }]}>
                <Text style={styles.categoryTagText}>{market.category}</Text>
              </View>

              <Text style={[styles.questionText, { color: theme.mode === 'dark' ? '#FFF' : '#1A1A1A' }]} numberOfLines={3}>
                {market.question}
              </Text>

              <View style={styles.pillRow}>
                {[`📊 ${market.volume}`, `💧 ${market.liquidity}`, `⏳ ${market.timeLeft}`].map((t, i) => (
                  <View key={i} style={[styles.pill, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                    <Text style={[styles.pillText, { color: theme.mode === 'dark' ? '#FFF' : '#1A1A1A' }]}>{t}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.probBarOuter, { backgroundColor: theme.purple }]}>
                <View style={[styles.probBarYes, { width: `${market.yesProb}%`, backgroundColor: theme.accent }]} />
              </View>
              <View style={styles.probLabels}>
                <Text style={[styles.probLabelText, { color: theme.accent }]}>YES {market.yesProb}%</Text>
                <Text style={[styles.probLabelText, { color: theme.mode === 'dark' ? '#FFF' : '#1A1A1A' }]}>NO {market.noProb}%</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Bet Amount</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.amountRow}>
            {amountOptions.map(opt => (
              <Pressable key={opt}
                style={[styles.amountChip, { backgroundColor: theme.glass, borderColor: theme.glassBorder },
                  amount === opt && { backgroundColor: theme.accentDim, borderColor: theme.accent }]}
                onPress={() => setAmount(opt)}>
                <Text style={[styles.amountChipText, { color: theme.textSecondary },
                  amount === opt && { color: theme.accent }]}>${opt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Dating-app style action bar */}
        <View style={[styles.actionBar, { backgroundColor: theme.mode === 'dark' ? 'rgba(30,12,46,0.8)' : 'rgba(245,245,247,0.9)', borderColor: theme.border }]}>
          <Pressable style={[styles.noBtn, { backgroundColor: theme.noBtnBg, borderColor: theme.noBtnBorder }]} onPress={() => flyCard('NO')}>
            <Text style={[styles.noBtnLabel, { color: theme.noBtnIcon }]}>No</Text>
          </Pressable>
          <Pressable style={[styles.yesBtn, { backgroundColor: theme.yesBtnBg, shadowColor: theme.accent }]}
            onPress={() => flyCard('YES')}>
            <Text style={[styles.yesBtnLabel, { color: theme.yesBtnIcon }]}>Yes</Text>
          </Pressable>
        </View>

        <View style={styles.detailsSection}>
          <Text style={[styles.detailsTitle, { color: theme.textPrimary }]}>Market Details</Text>
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {[['Total Volume', market.volume], ['Liquidity', market.liquidity], ['Time Remaining', market.timeLeft], ['Category', market.category]].map(([label, value], i, arr) => (
              <React.Fragment key={label}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
                  <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{value}</Text>
                </View>
                {i < arr.length - 1 && <View style={[styles.detailDivider, { backgroundColor: theme.border }]} />}
              </React.Fragment>
            ))}
          </View>
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.detailSubtitle, { color: theme.textPrimary }]}>Probability Trend</Text>
            <View style={styles.trendRow}>
              {market.priceHistory.map((val, i) => (
                <View key={i} style={styles.trendBarContainer}>
                  <View style={[styles.trendBar, { height: `${val}%`, backgroundColor: val >= 50 ? theme.accent : theme.purple, opacity: 0.3 + (i / market.priceHistory.length) * 0.7 }]} />
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.detailSubtitle, { color: theme.textPrimary }]}>Potential Payout</Text>
            <View style={styles.payoutRow}>
              <View style={styles.payoutItem}>
                <Text style={[styles.payoutLabel, { color: theme.accent }]}>If YES wins</Text>
                <Text style={[styles.payoutValue, { color: theme.accent }]}>${(amount / (market.yesProb / 100)).toFixed(0)}</Text>
              </View>
              <View style={[styles.payoutDivider, { backgroundColor: theme.border }]} />
              <View style={styles.payoutItem}>
                <Text style={[styles.payoutLabel, { color: theme.purple }]}>If NO wins</Text>
                <Text style={[styles.payoutValue, { color: theme.purple }]}>${(amount / (market.noProb / 100)).toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmationSheet visible={showConfirmation} prediction={pendingPrediction} amount={amount}
        estimatedPayout={estimatedPayout} onConfirm={handleConfirm} onClose={() => { setShowConfirmation(false); resetCard(); }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  topTitle: { fontSize: 24, fontWeight: '700' },
  balancePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  balanceText: { fontSize: 13, fontWeight: '700' },
  scrollContent: { paddingBottom: 120 },
  cardContainer: { alignItems: 'center', paddingHorizontal: 16, minHeight: CARD_HEIGHT + 10 },
  card: { width: '100%', maxWidth: 420, height: CARD_HEIGHT, borderRadius: 28, overflow: 'hidden', position: 'relative', cursor: 'grab' as any, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 16 },
  categoryIconBg: { position: 'absolute', top: '15%', alignSelf: 'center', opacity: 0.06 },
  categoryEmoji: { fontSize: 160 },
  glowEdge: { position: 'absolute', top: 0, bottom: 0, width: 120, zIndex: 1 },
  glowLeft: { left: 0 },
  glowRight: { right: 0 },
  stamp: { position: 'absolute', zIndex: 10, borderWidth: 5, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 10 },
  yesStamp: { top: 30, left: 24 },
  noStamp: { top: 30, right: 24 },
  yesStampText: { fontSize: 36, fontWeight: '900', letterSpacing: 6 },
  noStampText: { fontSize: 32, fontWeight: '900', letterSpacing: 4 },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, zIndex: 5 },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 10 },
  categoryTagText: { fontSize: 11, fontWeight: '700', color: '#FFF', textTransform: 'uppercase', letterSpacing: 1 },
  questionText: { fontSize: 24, fontWeight: '700', lineHeight: 30, marginBottom: 14 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '600' },
  probBarOuter: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  probBarYes: { height: '100%', borderRadius: 3 },
  probLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  probLabelText: { fontSize: 13, fontWeight: '700' },
  amountSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
  amountLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  amountRow: { gap: 8 },
  amountChip: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5 },
  amountChipText: { fontSize: 15, fontWeight: '600' },
  actionBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 16, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 40, borderWidth: 1 },
  noBtn: { flex: 1, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  noBtnLabel: { fontSize: 18, fontWeight: '700' },
  yesBtn: { flex: 1, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  yesBtnLabel: { fontSize: 18, fontWeight: '700' },
  detailsSection: { paddingHorizontal: 20, marginTop: 24 },
  detailsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 14 },
  detailCard: { borderRadius: radii.card, padding: 16, marginBottom: 12, borderWidth: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  detailDivider: { height: 1 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  detailSubtitle: { fontSize: 14, fontWeight: '600', marginBottom: 14 },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 4 },
  trendBarContainer: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  trendBar: { borderRadius: 3, minHeight: 4 },
  payoutRow: { flexDirection: 'row' },
  payoutItem: { flex: 1, alignItems: 'center' },
  payoutDivider: { width: 1, marginVertical: 4 },
  payoutLabel: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  payoutValue: { fontSize: 24, fontWeight: '800' },
});
