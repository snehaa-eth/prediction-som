import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme';
import { userProfile } from '../data/mockData';

const MAX_CONTENT_WIDTH = 600;

export const ProfileScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  const stats = [
    { label: 'Total Trades', value: userProfile.totalTrades.toString() },
    { label: 'Win Rate', value: `${userProfile.winRate}%` },
    { label: 'Total Profit', value: `$${userProfile.totalProfit.toLocaleString()}` },
    { label: 'Rank', value: `#${userProfile.rank}` },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.centered}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Profile</Text>

          {/* Theme Toggle */}
          <View>
            <View style={[styles.themeToggle, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.themeLabel, { color: theme.textPrimary }]}>
                {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View>
            <View style={[styles.walletCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.accentDim }]}>
                <Text style={[styles.avatarText, { color: theme.accent }]}>{userProfile.shortAddress.slice(2, 4)}</Text>
              </View>
              <View style={styles.walletInfo}>
                <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>Wallet Address</Text>
                <Text style={[styles.walletAddress, { color: theme.textPrimary }]}>{userProfile.shortAddress}</Text>
              </View>
              <Pressable style={[styles.copyBtn, { backgroundColor: theme.glass }]}>
                <Text style={[styles.copyBtnText, { color: theme.textSecondary }]}>Copy</Text>
              </Pressable>
            </View>
          </View>

          <View>
            <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Total Balance</Text>
              <Text style={[styles.balanceValue, { color: theme.accent }]}>${userProfile.balance.toLocaleString()}</Text>
              <View style={styles.balanceActions}>
                <Pressable style={[styles.balanceBtn, { backgroundColor: theme.accent }]}>
                  <Text style={styles.balanceBtnText}>Deposit</Text>
                </Pressable>
                <Pressable style={[styles.balanceBtn, styles.withdrawBtn, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                  <Text style={[styles.balanceBtnText, { color: theme.textPrimary }]}>Withdraw</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Statistics</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, i) => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                  <Text style={[styles.statValue, { color: i === 2 ? theme.profit : i === 3 ? theme.accent : theme.textPrimary }]}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Settings</Text>
            {['Notifications', 'Security', 'Help & Support', 'About'].map(item => (
              <Pressable key={item} style={[styles.settingsItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.settingsText, { color: theme.textPrimary }]}>{item}</Text>
                <Text style={[styles.settingsArrow, { color: theme.textSecondary }]}>›</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.disconnectBtn, { borderColor: theme.loss }]}>
            <Text style={[styles.disconnectText, { color: theme.loss }]}>Disconnect Wallet</Text>
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
  screenTitle: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  themeToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radii.card, padding: 16, marginBottom: 14, borderWidth: 1 },
  themeLabel: { fontSize: 16, fontWeight: '600' },
  walletCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.card, padding: 16, marginBottom: 14, borderWidth: 1 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  walletInfo: { flex: 1 },
  walletLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  walletAddress: { fontSize: 15, fontWeight: '500' },
  copyBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radii.sm },
  copyBtnText: { fontSize: 11, fontWeight: '500' },
  balanceCard: { borderRadius: radii.card, padding: 20, marginBottom: 24, borderWidth: 1 },
  balanceLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  balanceValue: { fontSize: 32, fontWeight: '700', marginBottom: 18 },
  balanceActions: { flexDirection: 'row', gap: 10 },
  balanceBtn: { flex: 1, height: 42, borderRadius: radii.button, justifyContent: 'center', alignItems: 'center' },
  balanceBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  withdrawBtn: { borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '48%', borderRadius: radii.button, padding: 16, borderWidth: 1 },
  statLabel: { fontSize: 11, fontWeight: '500', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700' },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 52, borderRadius: radii.button, paddingHorizontal: 16, marginBottom: 6, borderWidth: 1 },
  settingsText: { fontSize: 15 },
  settingsArrow: { fontSize: 22 },
  disconnectBtn: { marginTop: 24, height: 48, borderRadius: radii.button, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  disconnectText: { fontSize: 15, fontWeight: '500' },
});
