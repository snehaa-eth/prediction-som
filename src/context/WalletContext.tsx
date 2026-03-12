import React, { createContext, useContext } from 'react';
import { useAccount, useAppKit, useProvider } from '@reown/appkit-react-native';

type WalletContextValue = {
  address: string | null;
  shortAddress: string | null;
  logout: () => Promise<void>;
  openConnect: () => void;
  getProvider: () => Promise<unknown>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { open, disconnect } = useAppKit();
  const { provider } = useProvider();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const logout = async () => {
    await disconnect();
  };

  const openConnect = () => {
    open({ view: 'Connect' });
  };

  const value: WalletContextValue = {
    address: isConnected ? address ?? null : null,
    shortAddress: isConnected ? shortAddress : null,
    logout,
    openConnect,
    getProvider: async () => {
      if (!provider) throw new Error('No provider');
      return provider;
    },
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
