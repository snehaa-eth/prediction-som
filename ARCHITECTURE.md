# Prediction Market - Architecture (Polymarket-style + Account Abstraction)

## Overview

- **Account Abstraction**: Privy → social login (Google, Apple, email), embedded wallet, no MetaMask. User doesn't feel web3.
- **Contracts**: Polymarket-style CTF (Conditional Tokens) + CPMM trading, **manual resolution** (hackathon), production math.
- **Chain**: Base or Polygon (cheap gas, USDC)

---

## 1. Account Abstraction (WalletConnect / Reown AppKit)

| Component | Purpose |
|-----------|---------|
| **AppKit Provider** | Wraps app, manages connection |
| **Connect Modal** | WalletConnect, Email, Social (Google, Apple, etc.) |
| **Embedded Wallet** | Email/social login creates non-custodial wallet |
| **500+ Wallets** | MetaMask, Rainbow, Coinbase, etc. via WalletConnect |

Flow: User taps "Connect Wallet" → Modal opens → Choose email/social or external wallet → Connected.

---

## 2. Contract Architecture (Polymarket-inspired)

### Components

1. **ConditionalTokens** (Gnosis CTF fork)
   - Binary markets: YES + NO tokens, 1:1 collateralized with USDC
   - `split()`: USDC → YES + NO
   - `merge()`: YES + NO → USDC
   - `redeem()`: Winning tokens → USDC after resolution

2. **ResolutionOracle**
   - **Manual resolution** (hackathon): `resolver` calls `resolve(conditionId, outcome)`
   - `outcome = 0` → YES wins, `outcome = 1` → NO wins
   - Emits `ConditionResolved` for indexing

3. **PredictionMarket (CPMM)**
   - Creates markets, links to CTF condition
   - **CPMM (Constant Product)**: `x * y = k` for YES/NO liquidity
   - `buyOutcome(outcome, amount, minShares)` / `sellOutcome(outcome, shares, minAmount)`
   - Fee: 0.7% (configurable)
   - Production math: proper slippage, invariant

### Math (Production)

- **Probability**: YES price = `x / (x + y)` in pool (CPMM)
- **Buy YES**: `sharesOut = y * amountIn / (x + amountIn)` (simplified; full formula in contract)
- **Payout**: 1 YES = $1 USDC if YES wins
- **Slippage**: `minSharesOut` / `minAmountOut` params

---

## 3. Data Model (On-chain)

| Entity | Fields |
|--------|--------|
| Market | conditionId, question (ipfs), category, creator, liquidity, resolved, winningOutcome |
| Position | user, marketId, outcome (YES/NO), shares |
| Activity | trade / resolve / redeem events from logs |

---

## 4. App Integration

- **Markets**: Fetch from contract events or subgraph (conditionIds, liquidity, prices)
- **Portfolio**: User's YES/NO balances per market via `balanceOf`
- **Trades**: `buyOutcome` / `sellOutcome` via Privy's wallet (or smart account)
- **Resolution**: Admin UI (manual) for hackathon

---

## 5. File Structure

```
contracts/           # Solidity (Foundry)
  ConditionalTokens.sol
  ResolutionOracle.sol
  PredictionMarket.sol
src/
  lib/
    contracts/       # ABIs, addresses, hooks
    privy/           # Privy config
  screens/           # Updated for real data
```
