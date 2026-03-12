import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { radii } from '../theme';

interface Props {
  onConnect: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onConnect }) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: theme.accent, shadowColor: theme.accent }]}>
            <Text style={styles.logoText}>PM</Text>
          </View>
        </View>

        <View>
          <Text style={[styles.headline, { color: theme.textPrimary }]}>Predict the Future</Text>
        </View>

        <View>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>
            Trade predictions on real world events using crypto.
          </Text>
        </View>

        <View style={styles.features}>
          {['Binary YES/NO markets', 'Swipe to predict — instant & intuitive', 'Fully decentralized & on-chain'].map((text, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable style={[styles.ctaButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]} onPress={onConnect}>
          <Text style={styles.ctaText}>Connect Wallet</Text>
        </Pressable>

        <View style={styles.walletOptions}>
          {['WalletConnect', 'MetaMask', 'Coinbase Wallet'].map(wallet => (
            <Pressable key={wallet} style={[styles.walletOption, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]} onPress={onConnect}>
              <Text style={[styles.walletOptionText, { color: theme.textSecondary }]}>{wallet}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  headline: { fontSize: 36, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtext: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  features: { gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureDot: { width: 8, height: 8, borderRadius: 4 },
  featureText: { fontSize: 15 },
  bottom: { paddingHorizontal: 24, paddingBottom: 20 },
  ctaButton: { height: 52, borderRadius: radii.button, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  walletOptions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  walletOption: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.sm, borderWidth: 1 },
  walletOptionText: { fontSize: 11, fontWeight: '500' },
});
