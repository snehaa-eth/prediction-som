/**
 * PredictionMarket ABI - main functions for app
 * Full ABI from forge build: out/PredictionMarket.sol/PredictionMarket.json
 */
export const PREDICTION_MARKET_ABI = [
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
    name: 'getBuyAmountOut',
    inputs: [
      { name: 'marketId', type: 'uint256', internalType: 'uint256' },
      { name: 'outcome', type: 'uint8', internalType: 'uint8' },
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
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
    name: 'redeem',
    inputs: [{ name: 'marketId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
