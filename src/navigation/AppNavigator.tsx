import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';

import { MarketsScreen } from '../screens/MarketsScreen';
import { MarketDetailScreen } from '../screens/MarketDetailScreen';
import { PredictScreen } from '../screens/PredictScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MarketsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MarketsHome" component={MarketsScreen} />
    <Stack.Screen name="MarketDetail" component={MarketDetailScreen} />
  </Stack.Navigator>
);

export const MainTabs = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const icons: Record<string, string> = {
    Markets: '◎', Predict: '◆', Portfolio: '◈', Activity: '↻', Profile: '◉',
  };

  return (
    <Tab.Navigator
      initialRouteName="Predict"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 72 + insets.bottom, backgroundColor: theme.navBg, borderTopWidth: 1, borderTopColor: theme.navBorder, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12), elevation: 0, shadowOpacity: 0 },
        tabBarShowLabel: false,
      }}>
      {(['Markets', 'Predict', 'Portfolio', 'Activity', 'Profile'] as const).map(name => (
        <Tab.Screen
          key={name}
          name={name}
          component={
            name === 'Markets' ? MarketsStack :
            name === 'Predict' ? PredictScreen :
            name === 'Portfolio' ? PortfolioScreen :
            name === 'Activity' ? ActivityScreen : ProfileScreen
          }
          options={{
            tabBarIcon: ({ focused }) => {
              return (
                <View style={{ alignItems: 'center', gap: 3, width: 60 }}>
                  <Text style={{ fontSize: 22, color: focused ? theme.accent : theme.inactive }}>
                    {icons[name]}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: focused ? '700' : '500', color: focused ? theme.accent : theme.inactive, textAlign: 'center' }}>
                    {name}
                  </Text>
                </View>
              );
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
