# Setup Guide: Account Abstraction + Contracts

## 1. WalletConnect / Reown (Account Abstraction)

Get your Project ID:

1. Go to [https://cloud.reown.com](https://cloud.reown.com)
2. Create a project
3. Copy the **Project ID**

Create `.env` in the project root:

```bash
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

For Reown Dashboard: configure allowed app identifiers (e.g. `host.exp.Exponent` for Expo Go) and URL scheme `predictionmarket` under project settings.

## 2. Contracts (Foundry)

Install Foundry: [https://book.getfoundry.sh/getting-started/installation](https://book.getfoundry.sh/getting-started/installation)

```bash
cd contracts
forge install
forge build
```

Deploy (example for Base):

```bash
forge script script/Deploy.s.sol --rpc-url $BASE_RPC --broadcast --verify
```

Set `EXPO_PUBLIC_MARKET_ADDRESS` and `EXPO_PUBLIC_USDC_ADDRESS` in `.env` after deployment.

## 3. Manual Resolution (Hackathon)

The `resolve(marketId, outcome)` function can only be called by the `resolver` or `owner` address. For hackathon demos, use a resolver wallet you control. Outcome: `0` = YES wins, `1` = NO wins.

## 4. Run the App

```bash
npx expo start --clear
```

For iOS: `npx expo run:ios`  
For Android: `npx expo run:android`

## Architecture Summary

| Layer | Tech |
|-------|------|
| Auth | Privy (Google, Apple, Email) |
| Wallet | Privy Embedded Wallet (ERC-4337 ready) |
| Contracts | PredictionMarket (CPMM), manual resolution |
| Chain | Base / Polygon |
