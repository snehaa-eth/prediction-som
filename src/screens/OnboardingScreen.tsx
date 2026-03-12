import React from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Image, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { radii } from '../theme';
import { useAppKit } from '@reown/appkit-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STAR_COUNT = 35;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  left: Math.random() * SCREEN_WIDTH,
  top: Math.random() * SCREEN_HEIGHT * 0.55,
  size: 1.5 + Math.random() * 2.5,
  delay: Math.random() * 3000,
  duration: 2000 + Math.random() * 2000,
}));

const Star: React.FC<{ left: number; top: number; size: number; delay: number; duration: number; color: string }> = ({
  left, top, size, delay, duration, color,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.8, duration: duration * 0.4, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: duration * 0.6, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', left, top, width: size, height: size,
        borderRadius: size / 2, backgroundColor: color, opacity,
      }}
    />
  );
};

export const OnboardingScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { open } = useAppKit();

  const glowAnim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const starColor = isDark ? '#FF45A8' : '#8B5CF6';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D0011' : '#FFFFFF' }]}>
      {isDark && (
        <View style={styles.bgGradient}>
          <View style={[styles.gradientOrb, styles.orbPink]} />
          <View style={[styles.gradientOrb, styles.orbPurple]} />
        </View>
      )}
      {!isDark && (
        <View style={styles.bgGradient}>
          <View style={[styles.gradientOrb, styles.orbPinkLight]} />
          <View style={[styles.gradientOrb, styles.orbPurpleLight]} />
        </View>
      )}

      {stars.map(s => (
        <Star key={s.id} left={s.left} top={s.top} size={s.size} delay={s.delay} duration={s.duration} color={starColor} />
      ))}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.topSection}>
          <Animated.View style={[styles.logoGlow, {
            backgroundColor: isDark ? 'rgba(255,69,168,0.25)' : 'rgba(139,92,246,0.15)',
            opacity: glowAnim,
          }]} />
          <Animated.View style={[styles.logoGlowInner, {
            backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(255,69,168,0.1)',
            opacity: glowAnim,
          }]} />
          <Image source={require('../../assets/pred_logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.textSection}>
          <Text style={[styles.headline, { color: theme.textPrimary }]}>Predict{'\n'}the Future</Text>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>
            Swipe right for YES, left for NO.
          </Text>
          <View style={styles.features}>
            {['Binary YES/NO markets', 'Tinder-style swipe trading', 'Connect with WalletConnect or social login'].map((text, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.featureText, { color: isDark ? '#E0E0E0' : '#4B5563' }]}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
            onPress={() => open({ view: 'Connect' })}
          >
            <Text style={styles.ctaText}>Connect Wallet</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  gradientOrb: { position: 'absolute', borderRadius: 999 },
  orbPink: { width: 300, height: 300, top: -30, left: SCREEN_WIDTH * 0.15, backgroundColor: 'rgba(255,69,168,0.15)' },
  orbPurple: { width: 350, height: 350, top: 60, right: -60, backgroundColor: 'rgba(139,92,246,0.12)' },
  orbPinkLight: { width: 300, height: 300, top: -30, left: SCREEN_WIDTH * 0.15, backgroundColor: 'rgba(255,69,168,0.08)' },
  orbPurpleLight: { width: 350, height: 350, top: 60, right: -60, backgroundColor: 'rgba(139,92,246,0.06)' },
  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200, maxHeight: SCREEN_HEIGHT * 0.32 },
  logoGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  logoGlowInner: { position: 'absolute', width: 150, height: 150, borderRadius: 75 },
  logo: { width: 120, height: 120 },
  textSection: { paddingHorizontal: 32, marginBottom: 10 },
  headline: { fontSize: 42, fontWeight: '800', lineHeight: 48, marginBottom: 12 },
  subtext: { fontSize: 16, lineHeight: 22, marginBottom: 28 },
  features: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureDot: { width: 10, height: 10, borderRadius: 5 },
  featureText: { fontSize: 16, fontWeight: '500' },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 24, gap: 12 },
  ctaButton: {
    height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
