import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatUnits } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme';
import { useWallet } from '../context/WalletContext';
import { useUserStats } from '../hooks/useContract';

const MAX_CONTENT_WIDTH = 600;

export const ProfileScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { shortAddress, address, logout, exportKey } = useWallet();
  const { stats, balance, loading, refresh } = useUserStats();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const balanceDisplay = Number(formatUnits(balance, 18)).toFixed(2);
  const totalWonDisplay = stats ? Number(formatUnits(stats.totalWon, 18)).toFixed(0) : '0';
  const winRate = stats && (stats.wins + stats.losses) > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  const statsList = [
    { label: 'Total Trades', value: stats ? String(stats.wins + stats.losses) : '0', color: theme.textPrimary },
    { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? theme.profit : theme.loss },
    { label: 'Total Won', value: `${totalWonDisplay} TFY`, color: theme.accent },
    { label: 'W / L', value: stats ? `${stats.wins} / ${stats.losses}` : '0 / 0', color: theme.textPrimary },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.centered}>
          <View style={styles.titleRow}>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Profile</Text>
            <Pressable
              style={[styles.refreshBtn, { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent, borderWidth: 1 }]}
              onPress={refresh}>
              <Text style={[styles.refreshText, { color: theme.accent }]}>
                {loading ? '...' : '↻ Refresh'}
              </Text>
            </Pressable>
          </View>

          {/* Wallet card */}
          <View style={[styles.walletCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: 'rgba(196,149,106,0.12)' }]}>
              <Text style={[styles.avatarText, { color: theme.accent }]}>
                {shortAddress?.slice(2, 6) ?? '??'}
              </Text>
            </View>
            <View style={styles.walletInfo}>
              <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>Connected Wallet</Text>
              <Text style={[styles.walletAddress, { color: theme.textPrimary }]}>{shortAddress ?? '—'}</Text>
            </View>
            <Pressable
              style={[styles.copyBtn, { backgroundColor: copied ? 'rgba(80,227,164,0.12)' : 'rgba(196,149,106,0.08)', borderColor: copied ? theme.profit : theme.accent, borderWidth: 1 }]}
              onPress={handleCopy}>
              <Text style={[styles.copyBtnText, { color: copied ? theme.profit : theme.accent }]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </Pressable>
          </View>
          <View style={[styles.networkRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.networkDot, { backgroundColor: theme.profit }]} />
            <Text style={[styles.networkName, { color: theme.textPrimary }]}>Somnia Shannon Testnet</Text>
            <Text style={[styles.networkChain, { color: theme.textSecondary }]}>Chain 50312</Text>
          </View>

          {/* Balance */}
          <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
            <View style={[styles.balanceAccent, { backgroundColor: theme.accent }]} />
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>TFY Balance</Text>
            <Text style={[styles.balanceValue, { color: theme.accent }]}>
              {loading ? '...' : balanceDisplay}
            </Text>
          </View>

          {/* Stats grid */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            {statsList.map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* Settings */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Settings</Text>

          <View style={[styles.settingsItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.settingsText, { color: theme.textPrimary }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1CBC0', true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {['Notifications', 'Security', 'Help & Support', 'About'].map(item => (
            <Pressable key={item} style={[styles.settingsItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsText, { color: theme.textPrimary }]}>{item}</Text>
              <Text style={[styles.settingsArrow, { color: theme.textSecondary }]}>›</Text>
            </Pressable>
          ))}

          <Pressable
            style={[styles.exportBtn, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}
            onPress={async () => {
              const pk = await exportKey();
              if (!pk) return;
              await Clipboard.setStringAsync(pk);
              const msg = 'Private key copied to clipboard. Store it safely!';
              if (Platform.OS === 'web') window.alert(msg);
              else Alert.alert('Key Exported', msg);
            }}>
            <Text style={[styles.exportText, { color: theme.accent }]}>Export Private Key</Text>
          </Pressable>

          <Pressable style={[styles.disconnectBtn, { borderColor: theme.loss }]} onPress={() => logout()}>
            <Text style={[styles.disconnectText, { color: theme.loss }]}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  centered: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', padding: spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  refreshBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  refreshText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  walletCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.card, padding: 16, marginBottom: 14, borderWidth: 1 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  walletInfo: { flex: 1 },
  walletLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2, letterSpacing: 0.3 },
  walletAddress: { fontSize: 15, fontWeight: '600' },
  copyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  copyBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  networkRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.button, paddingHorizontal: 16, height: 44, marginBottom: 14, borderWidth: 1, gap: 8 },
  networkDot: { width: 6, height: 6, borderRadius: 3 },
  networkName: { fontSize: 13, fontWeight: '600', flex: 1 },
  networkChain: { fontSize: 11, fontWeight: '500' },
  balanceCard: { borderRadius: radii.card, padding: 22, marginBottom: 24, borderWidth: 1, overflow: 'hidden' },
  balanceAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  balanceLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8, letterSpacing: 0.5 },
  balanceValue: { fontSize: 36, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 14, letterSpacing: -0.3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '48%', borderRadius: radii.button, padding: 16, borderWidth: 1 },
  statLabel: { fontSize: 11, fontWeight: '500', marginBottom: 8, letterSpacing: 0.3 },
  statValue: { fontSize: 20, fontWeight: '800' },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 52, borderRadius: radii.button, paddingHorizontal: 16, marginBottom: 6, borderWidth: 1 },
  settingsText: { fontSize: 15, fontWeight: '500' },
  settingsArrow: { fontSize: 22 },
  exportBtn: { marginTop: 24, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  exportText: { fontSize: 14, fontWeight: '600' },
  disconnectBtn: { marginTop: 10, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  disconnectText: { fontSize: 15, fontWeight: '600' },
});
