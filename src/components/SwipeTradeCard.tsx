import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated, PanResponder, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const FLY_OUT_X = SCREEN_WIDTH * 1.5;

interface Props {
  amount: number;
  yesProb: number;
  noProb: number;
  question: string;
  onSwipeComplete: (direction: 'YES' | 'NO') => void;
}

export const SwipeTradeCard: React.FC<Props> = ({ amount, yesProb, noProb, question, onSwipeComplete }) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const resetCard = useCallback(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [translateX, translateY, cardOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => { translateX.setValue(gs.dx); translateY.setValue(gs.dy * 0.3); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: FLY_OUT_X, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]).start(() => { onSwipeComplete('YES'); setTimeout(resetCard, 500); });
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: -FLY_OUT_X, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]).start(() => { onSwipeComplete('NO'); setTimeout(resetCard, 500); });
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, stiffness: 180, damping: 18, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, stiffness: 180, damping: 18, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  const rotation = translateX.interpolate({ inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH], outputRange: ['-15deg', '0deg', '15deg'], extrapolate: 'clamp' });
  const yesStampOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD], outputRange: [0, 0.5, 1], extrapolate: 'clamp' });
  const yesStampScale = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0.5, 1], extrapolate: 'clamp' });
  const noStampOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.6, 0], outputRange: [1, 0.5, 0], extrapolate: 'clamp' });
  const noStampScale = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0.5], extrapolate: 'clamp' });
  const yesGlowOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 0.8], extrapolate: 'clamp' });
  const noGlowOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [0.8, 0], extrapolate: 'clamp' });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, opacity: cardOpacity, transform: [{ translateX }, { translateY }, { rotate: rotation }] }]}>
        {/* Gold accent top */}
        <View style={[styles.accentTop, { backgroundColor: theme.accent }]} />

        <Animated.View style={[styles.glowLeft, { backgroundColor: 'rgba(232,85,109,0.15)', opacity: noGlowOpacity }]} />
        <Animated.View style={[styles.glowRight, { backgroundColor: 'rgba(196,149,106,0.2)', opacity: yesGlowOpacity }]} />

        <Animated.View style={[styles.stamp, styles.yesStamp, { borderColor: theme.accent, opacity: yesStampOpacity, transform: [{ scale: yesStampScale }, { rotate: '-12deg' }] }]}>
          <Text style={[styles.stampText, { color: theme.accent }]}>YES</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.noStamp, { borderColor: theme.loss, opacity: noStampOpacity, transform: [{ scale: noStampScale }, { rotate: '12deg' }] }]}>
          <Text style={[styles.stampText, { color: theme.loss }]}>NO</Text>
        </Animated.View>

        <View style={styles.content}>
          <Text style={[styles.questionText, { color: theme.textPrimary }]} numberOfLines={2}>{question}</Text>

          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>YOUR STAKE</Text>
            <Text style={[styles.amountValue, { color: theme.accent }]}>{amount} TFY</Text>
          </View>

          <View style={styles.probRow}>
            <View style={[styles.probChip, { backgroundColor: 'rgba(196,149,106,0.10)' }]}>
              <Text style={[styles.probText, { color: theme.accent }]}>YES {yesProb}%</Text>
            </View>
            <View style={[styles.probChip, { backgroundColor: theme.glass }]}>
              <Text style={[styles.probText, { color: theme.textSecondary }]}>NO {noProb}%</Text>
            </View>
          </View>

          <View style={styles.swipeHint}>
            <Text style={[styles.hintArrow, { color: theme.loss }]}>← NO</Text>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              {Platform.OS === 'web' ? 'drag card' : 'swipe'}
            </Text>
            <Text style={[styles.hintArrow, { color: theme.accent }]}>YES →</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', minHeight: 280, justifyContent: 'center' },
  card: { width: '100%', maxWidth: 400, height: 280, borderRadius: 24, borderWidth: 1, overflow: 'hidden', position: 'relative', cursor: 'grab' as any, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 },
  accentTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  glowLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 100 },
  glowRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 100 },
  stamp: { position: 'absolute', zIndex: 10, borderWidth: 3, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 6 },
  yesStamp: { top: 24, left: 24 },
  noStamp: { top: 24, right: 24 },
  stampText: { fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  questionText: { fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 4 },
  amountContainer: { alignItems: 'center', marginVertical: 6 },
  amountLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, letterSpacing: 2 },
  amountValue: { fontSize: 36, fontWeight: '800' },
  probRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  probChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  probText: { fontSize: 13, fontWeight: '700' },
  swipeHint: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  hintArrow: { fontSize: 12, fontWeight: '600', opacity: 0.5 },
  hintText: { fontSize: 10, fontWeight: '500', opacity: 0.35, textTransform: 'uppercase', letterSpacing: 2 },
});
