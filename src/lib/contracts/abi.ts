/**
 * PredictionMarket ABI — full contract interface (Somnia Testnet)
 */
export const PREDICTION_MARKET_ABI = [
  // ── Read functions ────────────────────────────────────────────
  {
    type: 'function',
    name: 'markets',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'question', type: 'string', internalType: 'string' },
      { name: 'yesReserve', type: 'uint256', internalType: 'uint256' },
      { name: 'noReserve', type: 'uint256', internalType: 'uint256' },
      { name: 'resolved', type: 'bool', internalType: 'bool' },
      { name: 'winningOutcome', type: 'uint8', internalType: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'marketCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'positions',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'uint8', internalType: 'uint8' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getYesProbability',
    inputs: [{ name: 'marketId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMarket',
    inputs: [{ name: 'marketId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'question', type: 'string', internalType: 'string' },
      { name: 'yesReserve', type: 'uint256', internalType: 'uint256' },
      { name: 'noReserve', type: 'uint256', internalType: 'uint256' },
      { name: 'resolved', type: 'bool', internalType: 'bool' },
      { name: 'winningOutcome', type: 'uint8', internalType: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserStats',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'wins', type: 'uint256', internalType: 'uint256' },
      { name: 'losses', type: 'uint256', internalType: 'uint256' },
      { name: 'totalWon', type: 'uint256', internalType: 'uint256' },
      { name: 'totalLost', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPendingReward',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTraderCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTraderByIndex',
    inputs: [{ name: 'index', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'collateral',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'feeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  // ── Write functions ───────────────────────────────────────────
  {
    type: 'function',
    name: 'createMarket',
    inputs: [{ name: 'question', type: 'string', internalType: 'string' }],
    outputs: [{ name: 'marketId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addLiquidity',
    inputs: [
      { name: 'marketId', type: 'uint256', internalType: 'uint256' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'buyOutcome',
    inputs: [
      { name: 'marketId', type: 'uint256', internalType: 'uint256' },
      { name: 'outcome', type: 'uint8', internalType: 'uint8' },
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'minSharesOut', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'sharesOut', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sellOutcome',
    inputs: [
      { name: 'marketId', type: 'uint256', internalType: 'uint256' },
      { name: 'outcome', type: 'uint8', internalType: 'uint8' },
      { name: 'sharesIn', type: 'uint256', internalType: 'uint256' },
      { name: 'minAmountOut', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'redeem',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ── Events ────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'MarketCreated',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'question', type: 'string', indexed: false, internalType: 'string' },
    ],
  },
  {
    type: 'event',
    name: 'LiquidityAdded',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'Bought',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'outcome', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'amountIn', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'sharesOut', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'buyer', type: 'address', indexed: false, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'Sold',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'outcome', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'sharesIn', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'amountOut', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'seller', type: 'address', indexed: false, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'Resolved',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'outcome', type: 'uint8', indexed: false, internalType: 'uint8' },
    ],
  },
  {
    type: 'event',
    name: 'Redeemed',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'SettlementProcessed',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'user', type: 'address', indexed: false, internalType: 'address' },
      { name: 'reward', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const;

/** ERC-20 ABI — only the methods we need for collateral (TFY) token */
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
] as const;
