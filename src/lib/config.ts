/**
 * App config - set EXPO_PUBLIC_* in .env or app.config.js
 * Get Project ID: https://cloud.reown.com → Create Project
 */
export const WALLETCONNECT_PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

/** Somnia Shannon Testnet */
export const CHAIN_ID = 50312;
export const CHAIN_ID_HEX = '0xC488' as const;
export const RPC_URL = 'https://dream-rpc.somnia.network/';
export const EXPLORER_URL = 'https://shannon-explorer.somnia.network';

/** Contract addresses — deployed on Somnia Testnet */
export const PREDICTION_MARKET_ADDRESS = (process.env.EXPO_PUBLIC_MARKET_ADDRESS ?? '0xEf94e447c1cD561307EB606E2edd31Fd8A239082') as `0x${string}`;
export const COLLATERAL_ADDRESS = (process.env.EXPO_PUBLIC_COLLATERAL_ADDRESS ?? '0x6D6eD86155CA2BF79e12b2499e0a9bd3563A1C4f') as `0x${string}`; // TFY token
