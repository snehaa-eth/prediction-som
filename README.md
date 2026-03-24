# Twister

A swipe-to-trade prediction market app built on the **Somnia blockchain**. Think Tinder meets Polymarket — swipe right for YES, left for NO.

## Features

- **Swipe-to-Trade** — Tinder-style card interface for fast binary predictions
- **In-App Wallet** — No MetaMask needed. Instant local wallet with zero popups
- **On-Chain Markets** — All trades settle on Somnia Shannon Testnet via CPMM (Constant Product Market Maker)
- **Somnia Reactivity** — Auto-settlement when markets resolve using Somnia's reactive smart contracts
- **Leaderboard** — On-chain ranking by wins/losses
- **Portfolio Tracking** — View open positions, sell shares, redeem winnings
- **Luxury Gold Theme** — Dark mode with warm rose-gold accents

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React Native + Expo (SDK 54) |
| Navigation | React Navigation (bottom tabs + stack) |
| Blockchain | Somnia Shannon Testnet (Chain ID: 50312) |
| Smart Contracts | Solidity 0.8.30 + Hardhat |
| Contract Pattern | CPMM with Somnia Reactivity for auto-settlement |
| Wallet | Local embedded wallet (ethers.js + expo-secure-store) |
| Token | TFY (TinderFy) — ERC-20 collateral token |
| Funder API | Express.js on Vercel (auto-funds new wallets) |

## Architecture

```
PredictionMarket/
├── src/
│   ├── components/        # MarketCard, SwipeTradeCard, ConfirmationSheet, etc.
│   ├── context/           # WalletContext (local embedded wallet)
│   ├── hooks/             # useContract (markets, positions, stats, tx)
│   ├── lib/
│   │   ├── config.ts      # Chain config, contract addresses
│   │   ├── funder.ts      # Auto-fund API client
│   │   └── contracts/     # ABI definitions
│   ├── navigation/        # Bottom tabs + stack navigator
│   ├── screens/           # Markets, Predict, Portfolio, Leaderboard, Profile
│   └── theme/             # Luxury gold dark/light theme
├── reactivity-prediction/ # Hardhat project (smart contracts)
│   ├── contracts/
│   │   ├── PredictionReactivity.sol  # Main prediction market contract
│   │   └── CollateralToken.sol       # TFY ERC-20 token
│   └── scripts/           # Deploy, seed markets, test
├── funder-server/         # Vercel serverless API for wallet funding
│   └── api/fund.js        # POST /fund → sends STT + mints TFY
└── App.tsx                # Root component
```

## Smart Contracts (Somnia Testnet)

| Contract | Address |
|----------|---------|
| PredictionMarket | `0xEf94e447c1cD561307EB606E2edd31Fd8A239082` |
| Collateral (TFY) | `0x6D6eD86155CA2BF79e12b2499e0a9bd3563A1C4f` |

### Key Functions

| Function | Description |
|----------|-------------|
| `createMarket(question)` | Create a new YES/NO market |
| `addLiquidity(marketId, amount)` | Add TFY liquidity to both sides |
| `buyOutcome(marketId, outcome, amountIn, minSharesOut)` | Buy YES (0) or NO (1) shares |
| `sellOutcome(marketId, outcome, sharesIn, minAmountOut)` | Sell shares back |
| `resolve(marketId, outcome)` | Resolve market (owner/resolver only) |
| `redeem()` | Claim all pending winnings |
| `getUserStats(address)` | Get wins, losses, total won/lost |
| `getYesProbability(marketId)` | Get YES probability (0-10000 bps) |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### 1. Install dependencies

```bash
cd PredictionMarket
npm install
```

### 2. Set up environment

Create `.env` in root:

```env
EXPO_PUBLIC_MARKET_ADDRESS=0xEf94e447c1cD561307EB606E2edd31Fd8A239082
EXPO_PUBLIC_COLLATERAL_ADDRESS=0x6D6eD86155CA2BF79e12b2499e0a9bd3563A1C4f
EXPO_PUBLIC_FUNDER_API=https://funder-server.vercel.app/fund
```

### 3. Run funder server (local dev)

```bash
cd funder-server
npm install
# Create .env with DEPLOYER_KEY=0x...
node index.js
```

### 4. Start the app

```bash
npx expo start
```

### 5. Seed markets (first time)

```bash
cd reactivity-prediction
npm install
# Create .env with PRIVATE_KEY=0x...
npx hardhat run scripts/seed-markets.ts --network somniaTestnet
```

## Build APK

```bash
eas build --platform android --profile preview
```

## Deployment

### Funder Server (Vercel)

```bash
cd funder-server
npx vercel --prod
# Set DEPLOYER_KEY as environment secret in Vercel dashboard
```

### App (EAS)

```bash
# Set env vars on EAS
eas env:create --name EXPO_PUBLIC_FUNDER_API --value "https://your-funder.vercel.app/fund" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_MARKET_ADDRESS --value "0xEf94e447c1cD561307EB606E2edd31Fd8A239082" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_COLLATERAL_ADDRESS --value "0x6D6eD86155CA2BF79e12b2499e0a9bd3563A1C4f" --environment production --visibility plaintext

# Build
eas build --platform android --profile preview
```

## How It Works

1. **User opens app** → Creates a local wallet (keypair stored in SecureStore)
2. **Auto-funded** → Funder API sends STT (gas) + mints TFY (trading tokens)
3. **Browse markets** → Fetched from Somnia chain in parallel
4. **Swipe to trade** → Signs tx locally with embedded wallet (no MetaMask popup)
5. **Market resolves** → Somnia Reactivity auto-settles positions via `_onEvent`
6. **Claim winnings** → Tap "Redeem" in Portfolio

## Network Info

| Property | Value |
|----------|-------|
| Network | Somnia Shannon Testnet |
| Chain ID | 50312 |
| RPC | https://dream-rpc.somnia.network/ |
| Explorer | https://shannon-explorer.somnia.network |
| Native Token | STT |

## License

MIT
