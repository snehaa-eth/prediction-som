import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Image, Animated, Easing, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { fundNewWallet } from '../lib/funder';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STAR_COUNT = 40;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  left: Math.random() * SCREEN_WIDTH,
  top: Math.random() * SCREEN_HEIGHT * 0.55,
  size: 1 + Math.random() * 2,
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
        Animated.timing(opacity, { toValue: 0.9, duration: duration * 0.4, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: duration * 0.6, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }} />
  );
};

export const OnboardingScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { createWallet, importWallet } = useWallet();
  const [showImport, setShowImport] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const glowAnim = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const [status, setStatus] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      setStatus('Creating wallet...');
      await createWallet();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create wallet');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleImport = async () => {
    if (!importKey.trim()) { setError('Enter a private key'); return; }
    setLoading(true);
    setError('');
    try {
      await importWallet(importKey.trim());
    } catch (e: any) {
      setError('Invalid private key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAF8' }]}>
      <View style={styles.bgGradient}>
        <View style={[styles.gradientOrb, { width: 320, height: 320, top: -40, left: SCREEN_WIDTH * 0.1, backgroundColor: isDark ? 'rgba(196,149,106,0.08)' : 'rgba(196,149,106,0.06)' }]} />
        <View style={[styles.gradientOrb, { width: 280, height: 280, top: 80, right: -50, backgroundColor: isDark ? 'rgba(155,114,207,0.06)' : 'rgba(155,114,207,0.04)' }]} />
      </View>

      {stars.map(s => <Star key={s.id} left={s.left} top={s.top} size={s.size} delay={s.delay} duration={s.duration} color="#C4956A" />)}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.topSection}>
          <Animated.View style={[styles.logoGlow, { backgroundColor: 'rgba(196,149,106,0.15)', opacity: glowAnim }]} />
          <Image source={require('../../assets/pred_logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.textSection}>
          <Text style={[styles.headline, { color: theme.textPrimary }]}>Predict{'\n'}the Future</Text>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>
            Stake your conviction. Swipe to trade. No extensions needed.
          </Text>

          {!showImport ? (
            <View style={styles.features}>
              {[
                ['Instant in-app wallet — no MetaMask', '◆'],
                ['Swipe-to-trade — fast & seamless', '↔'],
                ['Earn rewards & climb the leaderboard', '★'],
              ].map(([text, icon], i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: 'rgba(196,149,106,0.12)' }]}>
                    <Text style={{ color: '#C4956A', fontSize: 14, fontWeight: '700' }}>{icon}</Text>
                  </View>
                  <Text style={[styles.featureText, { color: isDark ? '#C8C0B4' : '#5A5448' }]}>{text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.importSection}>
              <Text style={[styles.importLabel, { color: theme.textSecondary }]}>PASTE PRIVATE KEY</Text>
              <TextInput
                style={[styles.importInput, { backgroundColor: theme.secondaryBg, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="0x..."
                placeholderTextColor={theme.textSecondary}
                value={importKey}
                onChangeText={setImportKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          )}

          {error ? <Text style={[styles.errorText, { color: theme.loss }]}>{error}</Text> : null}
        </View>

        <View style={styles.bottom}>
          {loading ? (
            <ActivityIndicator size="large" color="#C4956A" />
          ) : !showImport ? (
            <>
              <Pressable style={[styles.ctaButton, { backgroundColor: '#C4956A', shadowColor: '#C4956A' }]} onPress={handleCreate}>
                <Text style={[styles.ctaText, { color: '#0A0A0A' }]}>Create Wallet</Text>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => setShowImport(true)}>
                <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>Import Existing Wallet</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={[styles.ctaButton, { backgroundColor: '#C4956A', shadowColor: '#C4956A' }]} onPress={handleImport}>
                <Text style={[styles.ctaText, { color: '#0A0A0A' }]}>Import Wallet</Text>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => { setShowImport(false); setError(''); }}>
                <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>Back</Text>
              </Pressable>
            </>
          )}
          <Text style={[styles.networkLabel, { color: theme.textSecondary }]}>Powered by Somnia Network</Text>
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
  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 180, maxHeight: SCREEN_HEIGHT * 0.28 },
  logoGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  logo: { width: 110, height: 110 },
  textSection: { paddingHorizontal: 32, marginBottom: 10 },
  headline: { fontSize: 42, fontWeight: '800', lineHeight: 48, marginBottom: 12, letterSpacing: -1 },
  subtext: { fontSize: 16, lineHeight: 22, marginBottom: 28 },
  features: { gap: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: 15, fontWeight: '500' },
  importSection: { gap: 10 },
  importLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  importInput: { height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
  errorText: { fontSize: 13, marginTop: 12 },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 24, gap: 12 },
  ctaButton: { height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  ctaText: { fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  secondaryBtn: { height: 50, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '500' },
  networkLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 4 },
});
