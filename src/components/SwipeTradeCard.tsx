import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated, PanResponder, Easing } from 'react-native';
import { radii } from '../theme';
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

export const SwipeTradeCard: React.FC<Props> = ({
  amount,
  yesProb,
  noProb,
  question,
  onSwipeComplete,
}) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const resetCard = useCallback(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [translateX, translateY, cardOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy * 0.3);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: FLY_OUT_X,
              duration: 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: gestureState.dy * 0.5,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeComplete('YES');
            setTimeout(resetCard, 500);
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -FLY_OUT_X,
              duration: 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: gestureState.dy * 0.5,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeComplete('NO');
            setTimeout(resetCard, 500);
          });
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              stiffness: 180,
              damping: 18,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              stiffness: 180,
              damping: 18,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const rotation = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const yesStampOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const yesStampScale = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0.5, 1],
    extrapolate: 'clamp',
  });

  const noStampOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.6, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const noStampScale = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  const yesGlowOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 0.8],
    extrapolate: 'clamp',
  });

  const noGlowOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [0.8, 0],
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

  return (
    <View style={styles.wrapper}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }, cardStyle]}>
        {/* Edge glows */}
        <Animated.View style={[styles.glowLeft, { backgroundColor: theme.noGlow, opacity: noGlowOpacity }]} />
        <Animated.View style={[styles.glowRight, { backgroundColor: theme.yesGlow, opacity: yesGlowOpacity }]} />

        {/* YES stamp overlay */}
        <Animated.View style={[styles.stamp, styles.yesStamp, { borderColor: theme.yes, opacity: yesStampOpacity, transform: [{ scale: yesStampScale }, { rotate: '-12deg' }] }]}>
          <Text style={[styles.yesStampText, { color: theme.yes }]}>YES</Text>
        </Animated.View>

        {/* NO stamp overlay */}
        <Animated.View style={[styles.stamp, styles.noStamp, { borderColor: theme.no, opacity: noStampOpacity, transform: [{ scale: noStampScale }, { rotate: '12deg' }] }]}>
          <Text style={[styles.noStampText, { color: theme.no }]}>NO</Text>
        </Animated.View>

        {/* Card content */}
        <View style={styles.content}>
          <Text style={[styles.questionText, { color: theme.textPrimary }]} numberOfLines={2}>
            {question}
          </Text>

          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Your Prediction</Text>
            <Text style={[styles.amountValue, { color: theme.accent }]}>${amount}</Text>
          </View>

          <View style={styles.probRow}>
            <View style={styles.probItem}>
              <View style={[styles.probDot, { backgroundColor: theme.yes }]} />
              <Text style={[styles.probText, { color: theme.yes }]}>YES {yesProb}%</Text>
            </View>
            <View style={styles.probItem}>
              <View style={[styles.probDot, { backgroundColor: theme.no }]} />
              <Text style={[styles.probText, { color: theme.no }]}>NO {noProb}%</Text>
            </View>
          </View>

          <View style={styles.swipeHint}>
            <Text style={[styles.hintArrowLeft, { color: theme.no }]}>← NO</Text>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              {Platform.OS === 'web' ? 'drag card' : 'swipe card'}
            </Text>
            <Text style={[styles.hintArrowRight, { color: theme.yes }]}>YES →</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    minHeight: 280,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    height: 280,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'grab' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  glowLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
  },
  glowRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
  },
  stamp: {
    position: 'absolute',
    zIndex: 10,
    borderWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  yesStamp: {
    top: 24,
    left: 24,
  },
  noStamp: {
    top: 24,
    right: 24,
  },
  yesStampText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  noStampText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  probRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  probItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  probDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  probText: {
    fontSize: 14,
    fontWeight: '600',
  },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  hintArrowLeft: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  hintArrowRight: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
});
