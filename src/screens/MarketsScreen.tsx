import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { MarketCard } from '../components/MarketCard';
import { TrendingCard } from '../components/TrendingCard';
import { allMarkets, trendingMarkets, categories } from '../data/mockData';
import { Market } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

interface Props {
  navigation: any;
}

export const MarketsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filteredMarkets = allMarkets.filter(m => {
    const matchesSearch = m.question.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleMarketPress = (market: Market) => {
    navigation.navigate('MarketDetail', { market });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        {/* Sticky header + search bar */}
        <View style={[styles.stickyHeader, { backgroundColor: theme.primaryBg }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Markets</Text>
            <View style={[styles.balancePill, { backgroundColor: theme.accentDim }]}>
              <Text style={[styles.balanceText, { color: theme.accent }]}>$4,250.75</Text>
            </View>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.secondaryBg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Search markets..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <FlatList
          data={filteredMarkets}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Trending</Text>
              </View>
              <FlatList
                data={trendingMarkets}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.trendingList}
                renderItem={({ item }) => (
                  <TrendingCard market={item} onPress={handleMarketPress} />
                )}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}>
                {categories.map(cat => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      activeCategory === cat && { backgroundColor: theme.accentDim, borderColor: theme.accent },
                    ]}
                    onPress={() => setActiveCategory(cat)}>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: theme.textSecondary },
                        activeCategory === cat && { color: theme.accent },
                      ]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>All Markets</Text>
                <Text style={[styles.marketCount, { color: theme.textSecondary }]}>{filteredMarkets.length}</Text>
              </View>
            </>
          }
          renderItem={({ item, index }) => (
            <View>
              <MarketCard market={item} onPress={handleMarketPress} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  stickyHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    zIndex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  balancePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    outlineStyle: 'none' as any,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  marketCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  trendingList: {
    paddingBottom: 16,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
