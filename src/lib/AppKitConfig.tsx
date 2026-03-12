import '@walletconnect/react-native-compat';

import { createAppKit } from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import { base } from 'viem/chains';
import * as Clipboard from 'expo-clipboard';
import { WALLETCONNECT_PROJECT_ID } from './config';
import { appKitStorage } from './StorageUtil';

const projectId = WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

const ethersAdapter = new EthersAdapter();

export const appKit = createAppKit({
  projectId,
  networks: [base],
  defaultNetwork: base,
  adapters: [ethersAdapter],
  storage: appKitStorage,
  metadata: {
    name: 'Prediction Market',
    description: 'Predict the future. Swipe to trade.',
    url: 'https://predictionmarket.app',
    icons: ['https://predictionmarket.app/icon.png'],
    redirect: {
      native: 'predictionmarket://',
      universal: 'https://predictionmarket.app',
    },
  },
  features: {
    socials: ['google', 'apple', 'email', 'x', 'discord'],
    showWallets: true,
    swaps: false,
    onramp: false,
  },
  clipboardClient: {
    setString: async (value: string) => {
      await Clipboard.setStringAsync(value);
    },
  },
});
