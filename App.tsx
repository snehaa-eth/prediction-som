import React, { useState } from 'react';
import { Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { MainTabs } from './src/navigation/AppNavigator';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

function AppInner() {
  const [isConnected, setIsConnected] = useState(false);
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isConnected ? (
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      ) : (
        <OnboardingScreen onConnect={() => setIsConnected(true)} />
      )}
    </>
  );
}

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const FALLBACK_METRICS = {
  insets: { top: Platform.OS === 'ios' ? 47 : 24, left: 0, right: 0, bottom: Platform.OS === 'ios' ? 34 : 0 },
  frame: { x: 0, y: 0, width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics ?? FALLBACK_METRICS}>
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
