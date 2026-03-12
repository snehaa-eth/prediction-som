import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { activities } from '../data/mockData';
import { Activity } from '../types';
import type { AppTheme } from '../theme';

const MAX_CONTENT_WIDTH = 600;

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'trade': return '↔';
    case 'win': return '✓';
    case 'loss': return '✗';
  }
};

const getActivityColor = (type: Activity['type'], theme: AppTheme) => {
  switch (type) {
    case 'trade': return theme.accent;
    case 'win': return theme.profit;
    case 'loss': return theme.loss;
  }
};

const getActivityLabel = (item: Activity) => {
  switch (item.type) {
    case 'trade': return `Predicted ${item.prediction}`;
    case 'win': return 'Won';
    case 'loss': return 'Lost';
  }
};

export const ActivityScreen: React.FC = () => {
  const { theme } = useTheme();

  const renderItem = ({ item, index }: { item: Activity; index: number }) => {
    const iconColor = getActivityColor(item.type, theme);
    return (
      <View>
        <View style={[styles.activityItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
            <Text style={[styles.icon, { color: iconColor }]}>{getActivityIcon(item.type)}</Text>
          </View>
          <View style={styles.activityInfo}>
            <Text style={[styles.activityMarket, { color: theme.textPrimary }]}>{item.market}</Text>
            <Text style={[styles.activityLabel, { color: theme.textSecondary }]}>{getActivityLabel(item)}</Text>
          </View>
          <View style={styles.activityRight}>
            <Text
              style={[
                styles.activityAmount,
                { color: item.type === 'loss' ? theme.loss : theme.textPrimary },
              ]}>
              {item.type === 'loss' ? '-' : item.type === 'win' ? '+' : ''}${item.amount}
            </Text>
            <Text style={[styles.activityTime, { color: theme.textSecondary }]}>{item.timestamp}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primaryBg }]} edges={['top', 'left', 'right']}>
      <View style={styles.centered}>
        <FlatList
          data={activities}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Activity</Text>}
          renderItem={renderItem}
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    borderRadius: radii.button,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  activityInfo: {
    flex: 1,
  },
  activityMarket: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '500',
  },
});
