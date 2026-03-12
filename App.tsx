import '@walletconnect/react-native-compat';

import React from 'react';
import { View, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppKitProvider, AppKit, useAccount } from '@reown/appkit-react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { MainTabs } from './src/navigation/AppNavigator';
import { WalletProvider } from './src/context/WalletContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { appKit } from './src/lib/AppKitConfig';

function AppInner() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate />
    </>
  );
}

function AuthGate() {
  const { isConnected } = useAccount();

  return isConnected ? (
    <NavigationContainer>
      <WalletProvider>
        <MainTabs />
      </WalletProvider>
    </NavigationContainer>
  ) : (
    <OnboardingScreen />
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
        <AppKitProvider instance={appKit}>
          <ThemeProvider>
            <View style={{ flex: 1 }}>
              <AppInner />
              <AppKit />
            </View>
          </ThemeProvider>
        </AppKitProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
