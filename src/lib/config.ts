/**
 * App config - set EXPO_PUBLIC_* in .env or app.config.js
 * Get Project ID: https://cloud.reown.com → Create Project
 */
export const WALLETCONNECT_PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

/** Base Sepolia for testing; change to Base mainnet / Polygon for prod */
export const CHAIN_ID = 8453; // Base mainnet
export const CHAIN_ID_HEX = '0x2105' as const;

/** Contract addresses - set after deployment */
export const PREDICTION_MARKET_ADDRESS = (process.env.EXPO_PUBLIC_MARKET_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const USDC_ADDRESS = (process.env.EXPO_PUBLIC_USDC_ADDRESS ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`; // Base USDC
