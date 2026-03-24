import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { MarketCard } from '../components/MarketCard';
import { TrendingCard } from '../components/TrendingCard';
import { useMarkets } from '../hooks/useContract';
import { Market } from '../types';

const MAX_CONTENT_WIDTH = 600;
const categories = ['All', 'Open', 'Resolved'] as const;

interface Props { navigation: any; }

export const MarketsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { markets, loading, error, refresh } = useMarkets();

  const searchFiltered = markets.filter(m =>
    m.question.toLowerCase().includes(search.toLowerCase()),
  );

  const allOpen = searchFiltered.filter(m => m.timeLeft !== 'Resolved');
  const allResolved = searchFiltered.filter(m => m.timeLeft === 'Resolved');
  const trendingMarkets = allOpen.slice(0, 4);

  // Apply category filter
  const showOpen = activeCategory === 'All' || activeCategory === 'Open';
  const showResolved = activeCategory === 'All' || activeCategory === 'Resolved';

  // Open first, then resolved
  const listData: Market[] = [
    ...(showOpen ? allOpen : []),
    ...(showResolved ? allResolved : []),
  ];

  const handleMarketPress = (market: Market) => navigation.navigate('MarketDetail', { market });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        <View style={[styles.stickyHeader, { backgroundColor: theme.primaryBg }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Markets</Text>
            <Pressable onPress={refresh} style={[styles.refreshPill, { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent, borderWidth: 1 }]}>
              <Text style={[styles.refreshText, { color: theme.accent }]}>
                {loading ? '...' : `↻ ${markets.length}`}
              </Text>
            </Pressable>
          </View>
          <View style={[styles.searchBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Text style={[styles.searchIcon, { color: theme.textSecondary }]}>⌕</Text>
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search markets..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading && markets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Loading from Somnia...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.loss }]}>{error}</Text>
            <Pressable onPress={refresh} style={[styles.retryBtn, { backgroundColor: theme.accent }]}>
              <Text style={[styles.retryText, { color: '#0A0A0A' }]}>Retry</Text>
            </Pressable>
          </View>
        ) : markets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.accent, fontSize: 48, marginBottom: 8 }}>◎</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No markets created yet</Text>
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item, i) => item?.id ?? String(i)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
                {trendingMarkets.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Trending</Text>
                      <View style={[styles.liveDot, { backgroundColor: theme.profit }]} />
                    </View>
                    <FlatList data={trendingMarkets} horizontal showsHorizontalScrollIndicator={false} keyExtractor={item => item.id} contentContainerStyle={styles.trendingList} renderItem={({ item }) => <TrendingCard market={item} onPress={handleMarketPress} />} />
                  </>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
                  {categories.map(cat => (
                    <Pressable
                      key={cat}
                      style={[styles.categoryChip, { backgroundColor: theme.cardBg, borderColor: theme.border },
                        activeCategory === cat && { backgroundColor: 'rgba(196,149,106,0.08)', borderColor: theme.accent }]}
                      onPress={() => setActiveCategory(cat)}>
                      <Text style={[styles.categoryText, { color: theme.textSecondary },
                        activeCategory === cat && { color: theme.accent }]}>{cat}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            }
            renderItem={({ item }) => <MarketCard market={item} onPress={handleMarketPress} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  stickyHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, zIndex: 1 },
  listContent: { padding: spacing.lg, paddingTop: 0, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  refreshPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  refreshText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 23, borderWidth: 1, paddingHorizontal: 16, marginBottom: 20 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, outlineStyle: 'none' as any },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  marketCount: { fontSize: 13, fontWeight: '500', marginLeft: 'auto' },
  trendingList: { paddingBottom: 16 },
  categoriesScroll: { marginBottom: 16 },
  categoriesContent: { gap: 8, paddingVertical: 4 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { fontWeight: '700', fontSize: 14 },
});
