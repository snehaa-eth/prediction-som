import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Wallet, HDNodeWallet, JsonRpcProvider } from 'ethers';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RPC_URL } from '../lib/config';
import { fundNewWallet } from '../lib/funder';

const WALLET_KEY = 'pm_wallet_pk';

type WalletContextValue = {
  address: string | null;
  shortAddress: string | null;
  isConnected: boolean;
  loading: boolean;
  wallet: Wallet | HDNodeWallet | null;
  createWallet: () => Promise<void>;
  importWallet: (privateKey: string) => Promise<void>;
  exportKey: () => Promise<string | null>;
  logout: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

// Use SecureStore on native, AsyncStorage on web
async function saveKey(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getKey(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteKey(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | HDNodeWallet | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing wallet on mount
  useEffect(() => {
    (async () => {
      try {
        const pk = await getKey(WALLET_KEY);
        if (pk) {
          const provider = new JsonRpcProvider(RPC_URL);
          setWallet(new Wallet(pk, provider));
        }
      } catch {
        /* no wallet stored */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createWallet = useCallback(async () => {
    const provider = new JsonRpcProvider(RPC_URL);
    const newWallet = Wallet.createRandom(provider);
    await saveKey(WALLET_KEY, newWallet.privateKey);
    const connected = newWallet.connect(provider);
    setWallet(connected);
    // Auto-fund in background (STT for gas + TFY for trading)
    fundNewWallet(connected.address).catch(() => {});
  }, []);

  const importWallet = useCallback(async (privateKey: string) => {
    const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const provider = new JsonRpcProvider(RPC_URL);
    const imported = new Wallet(pk, provider);
    await saveKey(WALLET_KEY, imported.privateKey);
    setWallet(imported);
  }, []);

  const exportKey = useCallback(async () => {
    return getKey(WALLET_KEY);
  }, []);

  const logout = useCallback(async () => {
    await deleteKey(WALLET_KEY);
    setWallet(null);
  }, []);

  const address = wallet?.address ?? null;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const value: WalletContextValue = {
    address,
    shortAddress,
    isConnected: !!wallet,
    loading,
    wallet,
    createWallet,
    importWallet,
    exportKey,
    logout,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
