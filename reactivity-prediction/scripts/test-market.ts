import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();
const MARKET_ABI = [
  "function collateral() view returns (address)",
  "function createMarket(string question) returns (uint256)",
  "function addLiquidity(uint256 marketId,uint256 amount)",
  "function buyOutcome(uint256 marketId,uint8 outcome,uint256 amountIn,uint256 minSharesOut) returns (uint256)",
  "function sellOutcome(uint256 marketId,uint8 outcome,uint256 sharesIn,uint256 minAmountOut) returns (uint256)",
  "function resolve(uint256 marketId,uint8 outcome)",
  "function getMarket(uint256 marketId) view returns (string question,uint256 yesReserve,uint256 noReserve,bool resolved,uint8 winningOutcome)",
  "function getYesProbability(uint256 marketId) view returns (uint256)",
  "function getPendingReward(address user) view returns (uint256)",
  "function redeem()",
  "function positions(address user,uint256 marketId,uint8 outcome) view returns (uint256)",
  "event MarketCreated(uint256 indexed marketId,string question)",
  "event LiquidityAdded(uint256 indexed marketId,uint256 amount)",
  "event Bought(uint256 indexed marketId,uint8 outcome,uint256 amountIn,uint256 sharesOut,address buyer)",
  "event Sold(uint256 indexed marketId,uint8 outcome,uint256 sharesIn,uint256 amountOut,address seller)",
  "event Resolved(uint256 indexed marketId,uint8 outcome)",
  "event SettlementProcessed(uint256 indexed marketId,address user,uint256 reward)",
  "event Redeemed(address indexed user,uint256 amount)",
];

const ERC20_ABI = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function mint(address to,uint256 amount)",
];

const marketInterface = new ethers.Interface(MARKET_ABI);

function resolveContractAddress(): string {
  if (process.env.PREDICTION_MARKET_CONTRACT) return process.env.PREDICTION_MARKET_CONTRACT;
  const p = path.join(__dirname, "..", "deployments", "somniaTestnet.json");
  if (fs.existsSync(p)) {
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    if (json.address) return json.address;
  }
  throw new Error("PREDICTION_MARKET_CONTRACT not found. Set .env or deploy first.");
}

function parseAmount(value: string, decimals: number): bigint {
  const [whole, frac = ""] = value.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

async function waitForNextBlock(provider: any, lastBlock: bigint) {
  while (BigInt(await provider.getBlockNumber()) <= lastBlock) {
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function fetchParsedLogs(
  fromBlock: bigint,
  toBlock: bigint,
  topics: Array<string | null>,
  contract: string,
) {
  const logs = (await ethers.provider.send("eth_getLogs", [
    {
      address: contract,
      fromBlock: ethers.toBeHex(fromBlock),
      toBlock: ethers.toBeHex(toBlock),
      topics,
    },
  ])) as Array<{
    address: string;
    topics: string[];
    data: string;
  }>;

  return logs
    .map((log) => {
      try {
        return marketInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter((parsed): parsed is NonNullable<typeof parsed> => parsed !== null);
}

async function main() {
  const contractAddress = resolveContractAddress();
  const [signer] = await ethers.getSigners();
  const market = new ethers.Contract(contractAddress, MARKET_ABI, signer);

  const collateralAddress = process.env.PREDICTION_MARKET_COLLATERAL ?? (await market.collateral());
  const token = new ethers.Contract(collateralAddress, ERC20_ABI, signer);
  const decimalsRaw = await token.decimals().catch(() => 18);
  const decimals = typeof decimalsRaw === "bigint" ? Number(decimalsRaw) : decimalsRaw;
  const fmt = (v: bigint) => `${ethers.formatUnits(v, decimals)} (${v.toString()})`;

  const question = process.env.TEST_MARKET_QUESTION ?? "Will this market resolve to YES?";
  const outcome = Number(process.env.TEST_OUTCOME ?? "1");
  const winningOutcome = Number(process.env.TEST_WINNING_OUTCOME ?? String(outcome));
  const liqAmount = parseAmount(process.env.TEST_LIQUIDITY ?? "100", decimals);
  const buyAmount = parseAmount(process.env.TEST_BUY_AMOUNT ?? "10", decimals);
  const adminBuyEnabled = process.env.TEST_ADMIN_BUY !== "0";
  const userBuyEnabled = process.env.TEST_USER_BUY !== "0";
  const sellShares = process.env.TEST_SELL_SHARES ? parseAmount(process.env.TEST_SELL_SHARES, decimals) : 0n;
  const pollBlocks = Number(process.env.TEST_POLL_BLOCKS ?? "20");
  const shouldRedeem = process.env.TEST_REDEEM === "1" || process.env.TEST_REDEEM === "true";

  console.log("📈 PredictionMarket reactive test");
  console.log("Contract     :", contractAddress);
  console.log("Collateral   :", collateralAddress);
  const userKey = process.env.USER_PRIVATE_KEY;
  const userWallet = userKey ? new ethers.Wallet(userKey, ethers.provider) : null;
  const rewardAddr = userWallet?.address ?? signer.address;
  const rewardSigner = userWallet ?? signer;

  console.log("Signer       :", signer.address);
  if (userWallet) console.log("User         :", userWallet.address);
  console.log("Question     :", question);
  console.log("Outcome buy  :", outcome);
  console.log("Outcome win  :", winningOutcome);
  console.log("Resolved sig :", ethers.id("Resolved(uint256,uint8)"));

  const balanceBefore = BigInt(await token.balanceOf(signer.address));
  console.log("Token balance:", fmt(balanceBefore));
  if (userWallet) {
    const userBal = BigInt(await token.balanceOf(userWallet.address));
    console.log("User balance :", fmt(userBal));
  }

  let marketId: bigint;
  if (process.env.TEST_MARKET_ID) {
    marketId = BigInt(process.env.TEST_MARKET_ID);
    console.log("Using market :", marketId.toString());
  } else {
    const createTx = await market.createMarket(question);
    const createReceipt = await createTx.wait();
    const created = createReceipt?.logs
      ?.map((log: any) => {
        try {
          return marketInterface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "MarketCreated");

    if (!created) throw new Error("MarketCreated event not found");
    marketId = created.args.marketId;
    console.log("Market ID    :", marketId.toString());
  }

  const marketInfo = await market.getMarket(marketId);
  const yesProb = await market.getYesProbability(marketId);
  console.log(
    "Market info  :",
    `{question="${marketInfo.question}" yes=${fmt(BigInt(marketInfo.yesReserve))} no=${fmt(BigInt(marketInfo.noReserve))} resolved=${marketInfo.resolved} outcome=${marketInfo.winningOutcome}}`,
  );
  console.log("Yes prob     :", `${Number(yesProb) / 100}%`);

  const allowance = BigInt(await token.allowance(signer.address, contractAddress));
  const needed = liqAmount + buyAmount;
  if (allowance < needed) {
    const approveTx = await token.approve(contractAddress, needed);
    await approveTx.wait();
    console.log("Approved     :", fmt(needed));
  }

  const addTx = await market.addLiquidity(marketId, liqAmount);
  await addTx.wait();
  console.log("Liquidity    :", fmt(liqAmount));

  let buyer = signer;
  if (userWallet) {
    const fundTarget = parseAmount(process.env.USER_FUND ?? "200", decimals);
    const userBal = BigInt(await token.balanceOf(userWallet.address));
    if (userBal < fundTarget) {
      const mintTx = await token.mint(userWallet.address, fundTarget - userBal);
      await mintTx.wait();
      console.log("Minted user  :", fmt(fundTarget - userBal));
    }

    const userToken = token.connect(userWallet);
    const userAllowance = BigInt(await userToken.allowance(userWallet.address, contractAddress));
    if (userAllowance < buyAmount) {
      const approveUserTx = await userToken.approve(contractAddress, buyAmount);
      await approveUserTx.wait();
      console.log("User approve :", fmt(buyAmount));
    }
    buyer = userWallet;
  }

  if (adminBuyEnabled) {
    const buyTx = await market.connect(signer).buyOutcome(marketId, outcome, buyAmount, 0);
    const buyReceipt = await buyTx.wait();
    const bought = buyReceipt?.logs
      ?.map((log: any) => {
        try {
          return marketInterface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "Bought");

    const sharesOut = bought?.args?.sharesOut ?? 0n;
    console.log("Admin bought :", fmt(sharesOut));
  }

  if (userWallet && userBuyEnabled) {
    const buyTx = await market.connect(userWallet).buyOutcome(marketId, outcome, buyAmount, 0);
    const buyReceipt = await buyTx.wait();
    const bought = buyReceipt?.logs
      ?.map((log: any) => {
        try {
          return marketInterface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "Bought");

    const sharesOut = bought?.args?.sharesOut ?? 0n;
    console.log("User bought  :", fmt(sharesOut));
  }

  if (sellShares > 0n) {
    const sellTx = await market.sellOutcome(marketId, outcome, sellShares, 0);
    await sellTx.wait();
    console.log("Sold shares  :", fmt(sellShares));
  }

  const pendingBefore = BigInt(await market.getPendingReward(rewardAddr));
  console.log("Pending before:", fmt(pendingBefore));
  const adminPendingBefore = BigInt(await market.getPendingReward(signer.address));
  console.log("Admin pending :", fmt(adminPendingBefore));
  const positionsBefore = await market.positions(rewardAddr, marketId, outcome);
  console.log("User shares  :", fmt(BigInt(positionsBefore)));

  const resolveTx = await market.resolve(marketId, winningOutcome);
  const resolveReceipt = await resolveTx.wait();
  console.log("Resolved     :", winningOutcome);

  const resolveBlock = BigInt(resolveReceipt?.blockNumber ?? (await ethers.provider.getBlockNumber()));
  const startBlock = resolveBlock > 0n ? resolveBlock - 1n : resolveBlock;
  let processedDetected = false;
  let lastSeenBlock = startBlock;

  for (let i = 0; i < pollBlocks; i++) {
    await waitForNextBlock(ethers.provider, lastSeenBlock);
    lastSeenBlock = BigInt(await ethers.provider.getBlockNumber());

    const events = await fetchParsedLogs(
      startBlock,
      lastSeenBlock,
      [
        ethers.id("SettlementProcessed(uint256,address,uint256)"),
        null,
        null,
      ],
      contractAddress,
    );

    if (events.length > 0) {
      const matching = events.filter((e) => {
        const args: any = e.args;
        return args?.user === rewardAddr && BigInt(args?.marketId ?? 0) === marketId;
      });
      if (matching.length > 0) {
        processedDetected = true;
        const latest = matching[matching.length - 1];
        const parsed = latest.args as any;
        console.log(
          "SettlementProcessed:",
          `marketId=${parsed.marketId?.toString()} reward=${parsed.reward?.toString()} block=${lastSeenBlock.toString()}`,
        );
        break;
      }
    }
  }

  const pendingAfter = BigInt(await market.getPendingReward(rewardAddr));
  console.log("Pending after :", fmt(pendingAfter));
  console.log("Pending delta :", fmt(pendingAfter - pendingBefore));
  const adminPendingAfter = BigInt(await market.getPendingReward(signer.address));
  console.log("Admin pending :", fmt(adminPendingAfter));
  const positionsAfter = await market.positions(rewardAddr, marketId, outcome);
  console.log("User shares  :", fmt(BigInt(positionsAfter)));

  const pendingIncreased = pendingAfter > pendingBefore;
  if (processedDetected) {
    console.log("✅ Reactivity working: SettlementProcessed detected.");
  } else if (pendingIncreased) {
    console.log("✅ Reactivity working: pending rewards increased after resolve.");
    console.log("   (Logs not found via RPC; confirming by state change.)");
    const latest = BigInt(await ethers.provider.getBlockNumber());
    const scan = await fetchParsedLogs(
      startBlock,
      latest,
      [
        ethers.id("SettlementProcessed(uint256,address,uint256)"),
        null,
        null,
      ],
      contractAddress,
    );
    const scanMatch = scan.filter((e) => {
      const args: any = e.args;
      return BigInt(args?.marketId ?? 0) === marketId;
    });
    console.log(`   SettlementProcessed logs found: ${scan.length}`);
    console.log(`   SettlementProcessed for market: ${scanMatch.length}`);
  } else {
    console.log("❌ Reactivity not confirmed: pending rewards unchanged.");
    console.log("   Check subscription topic Resolved(uint256,uint8) and emitter address.");
  }

  if (shouldRedeem) {
    if (pendingAfter > 0n) {
      const redeemTx = await market.connect(rewardSigner).redeem();
      await redeemTx.wait();
      console.log("Redeemed     :", fmt(pendingAfter));
    } else {
      console.log("Redeem step  : skipped (no pending reward)");
    }
  }

  const balanceAfter = BigInt(await token.balanceOf(signer.address));
  console.log("Token balance:", fmt(balanceAfter));
}

main().catch((err) => {
  console.error("❌ test script failed");
  console.error(err);
  process.exit(1);
});
