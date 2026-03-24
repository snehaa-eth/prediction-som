import '@walletconnect/react-native-compat';

import { createAppKit } from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import type { AppKitNetwork } from '@reown/appkit-react-native';
import * as Clipboard from 'expo-clipboard';
import { WALLETCONNECT_PROJECT_ID } from './config';
import { appKitStorage } from './StorageUtil';

/** Somnia Shannon Testnet — custom chain definition */
export const somniaTestnet: AppKitNetwork = {
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shannon Explorer',
      url: 'https://shannon-explorer.somnia.network',
    },
  },
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:50312',
  testnet: true,
};

const projectId = WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

const ethersAdapter = new EthersAdapter();

export const appKit = createAppKit({
  projectId,
  networks: [somniaTestnet],
  defaultNetwork: somniaTestnet,
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
    socials: false,
    showWallets: true,
    swaps: false,
    onramp: false,
    smartSessions: false,
  },
  clipboardClient: {
    setString: async (value: string) => {
      await Clipboard.setStringAsync(value);
    },
  },
});
