import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Pressable, ScrollView, Platform,
  Animated, PanResponder, Easing, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatUnits } from 'ethers';
import { useTheme } from '../theme/ThemeContext';
import { radii } from '../theme';
import { useMarkets, usePredictionTx, useUserStats } from '../hooks/useContract';
import { ConfirmationSheet } from '../components/ConfirmationSheet';
import { Toast } from '../components/Toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.56, 500);
const SWIPE_THRESHOLD = 100;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;

export const PredictScreen: React.FC = () => {
  const { theme } = useTheme();
  const { markets, loading: marketsLoading } = useMarkets();
  const { balance } = useUserStats();
  const { buyOutcome, pending: txPending } = usePredictionTx();

  const activeMarkets = markets.filter(m => m.timeLeft !== 'Resolved');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [amount, setAmount] = useState(100);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<'YES' | 'NO'>('YES');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const market = activeMarkets.length > 0
    ? activeMarkets[currentIndex % activeMarkets.length]
    : null;

  const advanceCard = useCallback(() => {
    // Reset animation values FIRST, then advance index so new card renders fresh
    translateX.setValue(0);
    translateY.setValue(0);
    cardOpacity.setValue(1);
    setCurrentIndex(p => p + 1);
  }, [translateX, translateY, cardOpacity]);

  const handleSwipeComplete = useCallback((dir: 'YES' | 'NO') => {
    console.log('[Predict] Swipe complete:', dir);
    setPendingPrediction(dir);
    setShowConfirmation(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!market) { console.log('[Predict] No market, skipping'); return; }
    console.log('[Predict] Confirm pressed — market:', market.id, 'prediction:', pendingPrediction, 'amount:', amount);
    setShowConfirmation(false);

    // Show loading toast
    setToastType('success');
    setToastMessage(`Submitting ${pendingPrediction} trade...`);
    setToastVisible(true);

    try {
      const outcome = pendingPrediction === 'YES' ? 0 : 1;
      console.log('[Predict] Calling buyOutcome — marketId:', market.id, 'outcome:', outcome, 'amount:', amount);
      const receipt = await buyOutcome(Number(market.id), outcome as 0 | 1, String(amount));
      console.log('[Predict] TX success! Hash:', receipt?.hash);
      setToastType('success');
      setToastMessage(`${pendingPrediction} with ${amount} TFY — Trade Placed!`);
      setToastVisible(true);
    } catch (e: any) {
      console.error('[Predict] TX failed:', e);
      const msg = e.reason || e.message || 'unknown error';
      setToastType('error');
      setToastMessage(`Failed: ${msg.slice(0, 80)}`);
      setToastVisible(true);
    }
    advanceCard();
  }, [pendingPrediction, amount, market, buyOutcome, advanceCard]);

  const flyCard = useCallback((dir: 'YES' | 'NO') => {
    const flyX = dir === 'YES' ? FLY_OUT_X : -FLY_OUT_X;
    Animated.parallel([
      Animated.timing(translateX, { toValue: flyX, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    handleSwipeComplete(dir);
  }, [handleSwipeComplete, translateX, cardOpacity]);

  const estimatedPayout = market
    ? pendingPrediction === 'YES'
      ? amount / (market.yesProb / 100)
      : amount / (market.noProb / 100)
    : 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 10,
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => { translateX.setValue(gs.dx); translateY.setValue(gs.dy * 0.25); },
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

  const rotation = translateX.interpolate({ inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ['-18deg', '0deg', '18deg'], extrapolate: 'clamp' });
  const yesStampOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], outputRange: [0, 0.4, 1], extrapolate: 'clamp' });
  const yesStampScale = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0.5, 1.1], extrapolate: 'clamp' });
  const noStampOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], outputRange: [1, 0.4, 0], extrapolate: 'clamp' });
  const noStampScale = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1.1, 0.5], extrapolate: 'clamp' });
  const yesGlowOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 0.6], extrapolate: 'clamp' });
  const noGlowOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [0.6, 0], extrapolate: 'clamp' });

  const cardStyle = { opacity: cardOpacity, transform: [{ translateX }, { translateY }, { rotate: rotation }] };
  const amountOptions = [25, 50, 100, 250, 500];
  const balanceDisplay = Number(formatUnits(balance, 18)).toFixed(1);

  if (marketsLoading && activeMarkets.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>Loading markets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!market) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ color: theme.accent, fontSize: 48, marginBottom: 12 }}>◆</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>No active markets</Text>
          <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>All markets are resolved or none exist yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Predict</Text>
        <View style={[styles.balancePill, { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent }]}>
          <Text style={[styles.balanceText, { color: theme.accent }]}>{balanceDisplay} TFY</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.cardContainer}>
          <Animated.View
            key={currentIndex}
            {...panResponder.panHandlers}
            style={[styles.card, cardStyle, {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            }]}>
            {/* Gold accent top */}
            <View style={[styles.accentTop, { backgroundColor: theme.accent }]} />

            <Animated.View style={[styles.glowEdge, styles.glowLeft, { backgroundColor: 'rgba(232,85,109,0.12)', opacity: noGlowOpacity }]} />
            <Animated.View style={[styles.glowEdge, styles.glowRight, { backgroundColor: 'rgba(196,149,106,0.18)', opacity: yesGlowOpacity }]} />

            <Animated.View style={[styles.stamp, styles.yesStamp, { borderColor: theme.accent, backgroundColor: 'rgba(196,149,106,0.08)', opacity: yesStampOpacity, transform: [{ scale: yesStampScale }, { rotate: '-15deg' }] }]}>
              <Text style={[styles.yesStampText, { color: theme.accent }]}>YES</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.noStamp, { borderColor: theme.loss, backgroundColor: 'rgba(232,85,109,0.08)', opacity: noStampOpacity, transform: [{ scale: noStampScale }, { rotate: '15deg' }] }]}>
              <Text style={[styles.noStampText, { color: theme.loss }]}>NOPE</Text>
            </Animated.View>

            <View style={[styles.bottomGradient, Platform.OS === 'web'
              ? { background: `linear-gradient(to top, ${theme.cardGradientEnd} 0%, ${theme.cardGradientMid} 50%, transparent 100%)` as any }
              : { backgroundColor: theme.mode === 'dark' ? 'rgba(10,10,10,0.6)' : 'rgba(250,250,248,0.7)' }
            ]} />

            <View style={styles.cardContent}>
              <View style={[styles.categoryTag, { backgroundColor: 'rgba(196,149,106,0.12)' }]}>
                <Text style={[styles.categoryTagText, { color: theme.accent }]}>{market.category}</Text>
              </View>

              <Text style={[styles.questionText, { color: theme.textPrimary }]} numberOfLines={3}>
                {market.question}
              </Text>

              <View style={styles.pillRow}>
                {[`${market.volume}`, `${market.liquidity} liq`, `${market.timeLeft}`].map((t, i) => (
                  <View key={i} style={[styles.pill, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                    <Text style={[styles.pillText, { color: theme.textSecondary }]}>{t}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.probBarOuter, { backgroundColor: theme.glass }]}>
                <View style={[styles.probBarYes, { width: `${market.yesProb}%`, backgroundColor: theme.accent }]} />
              </View>
              <View style={styles.probLabels}>
                <Text style={[styles.probLabelText, { color: theme.accent }]}>YES {market.yesProb}%</Text>
                <Text style={[styles.probLabelText, { color: theme.textSecondary }]}>NO {market.noProb}%</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>STAKE AMOUNT (TFY)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.amountRow}>
            {amountOptions.map(opt => (
              <Pressable key={opt}
                style={[styles.amountChip, { backgroundColor: theme.glass, borderColor: theme.glassBorder },
                  amount === opt && { backgroundColor: 'rgba(196,149,106,0.10)', borderColor: theme.accent }]}
                onPress={() => setAmount(opt)}>
                <Text style={[styles.amountChipText, { color: theme.textSecondary },
                  amount === opt && { color: theme.accent }]}>{opt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.actionBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Pressable style={[styles.noBtn, { borderColor: theme.loss }]}
            onPress={() => flyCard('NO')} disabled={txPending}>
            <Text style={[styles.noBtnLabel, { color: theme.loss }]}>No</Text>
          </Pressable>
          <Pressable style={[styles.yesBtn, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
            onPress={() => flyCard('YES')} disabled={txPending}>
            <Text style={[styles.yesBtnLabel, { color: '#0A0A0A' }]}>
              {txPending ? '...' : 'Yes'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.detailsSection}>
          <Text style={[styles.detailsTitle, { color: theme.textPrimary }]}>Market Details</Text>
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {[['Volume', market.volume], ['Liquidity', market.liquidity], ['Status', market.timeLeft], ['Market ID', `#${market.id}`]].map(([label, value], i, arr) => (
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
            <Text style={[styles.detailSubtitle, { color: theme.textPrimary }]}>Potential Payout</Text>
            <View style={styles.payoutRow}>
              <View style={styles.payoutItem}>
                <Text style={[styles.payoutLabel, { color: theme.accent }]}>If YES wins</Text>
                <Text style={[styles.payoutValue, { color: theme.accent }]}>{(amount / (market.yesProb / 100)).toFixed(0)} TFY</Text>
              </View>
              <View style={[styles.payoutDivider, { backgroundColor: theme.border }]} />
              <View style={styles.payoutItem}>
                <Text style={[styles.payoutLabel, { color: theme.textSecondary }]}>If NO wins</Text>
                <Text style={[styles.payoutValue, { color: theme.textSecondary }]}>{(amount / (market.noProb / 100)).toFixed(0)} TFY</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmationSheet visible={showConfirmation} prediction={pendingPrediction} amount={amount}
        estimatedPayout={estimatedPayout} onConfirm={handleConfirm} onClose={() => { setShowConfirmation(false); advanceCard(); }} />
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  topTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  balancePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  balanceText: { fontSize: 13, fontWeight: '700' },
  scrollContent: { paddingBottom: 120 },
  cardContainer: { alignItems: 'center', paddingHorizontal: 16, minHeight: CARD_HEIGHT + 10 },
  card: { width: '100%', maxWidth: 420, height: CARD_HEIGHT, borderRadius: 24, borderWidth: 1, overflow: 'hidden', position: 'relative', cursor: 'grab' as any, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 16 },
  accentTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20 },
  glowEdge: { position: 'absolute', top: 0, bottom: 0, width: 120, zIndex: 1 },
  glowLeft: { left: 0 },
  glowRight: { right: 0 },
  stamp: { position: 'absolute', zIndex: 10, borderWidth: 4, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 10 },
  yesStamp: { top: 30, left: 24 },
  noStamp: { top: 30, right: 24 },
  yesStampText: { fontSize: 34, fontWeight: '900', letterSpacing: 6 },
  noStampText: { fontSize: 30, fontWeight: '900', letterSpacing: 4 },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, zIndex: 5 },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  categoryTagText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  questionText: { fontSize: 22, fontWeight: '700', lineHeight: 28, marginBottom: 14 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: '600' },
  probBarOuter: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  probBarYes: { height: '100%', borderRadius: 2 },
  probLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  probLabelText: { fontSize: 13, fontWeight: '700' },
  amountSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
  amountLabel: { fontSize: 11, fontWeight: '600', marginBottom: 10, letterSpacing: 2 },
  amountRow: { gap: 8 },
  amountChip: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5 },
  amountChipText: { fontSize: 15, fontWeight: '600' },
  actionBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 16, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 40, borderWidth: 1 },
  noBtn: { flex: 1, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  noBtnLabel: { fontSize: 18, fontWeight: '700' },
  yesBtn: { flex: 1, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  yesBtnLabel: { fontSize: 18, fontWeight: '700' },
  detailsSection: { paddingHorizontal: 20, marginTop: 24 },
  detailsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 14, letterSpacing: -0.3 },
  detailCard: { borderRadius: radii.card, padding: 16, marginBottom: 12, borderWidth: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  detailDivider: { height: 1 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  detailSubtitle: { fontSize: 14, fontWeight: '600', marginBottom: 14 },
  payoutRow: { flexDirection: 'row' },
  payoutItem: { flex: 1, alignItems: 'center' },
  payoutDivider: { width: 1, marginVertical: 4 },
  payoutLabel: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  payoutValue: { fontSize: 24, fontWeight: '800' },
});
