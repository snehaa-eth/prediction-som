import { SDK } from "@somnia-chain/reactivity";
import { somniaTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
} from "viem";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

function normalizePrivateKey(raw?: string): `0x${string}` {
  if (!raw) throw new Error("PRIVATE_KEY not found");
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
}

function resolveContractAddress(): `0x${string}` {
  const fromEnv = process.env.PREDICTION_MARKET_CONTRACT;
  if (fromEnv) return fromEnv as `0x${string}`;

  const p = path.join(__dirname, "..", "deployments", "somniaTestnet.json");
  if (fs.existsSync(p)) {
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    if (json.address) return json.address as `0x${string}`;
  }
  throw new Error("PREDICTION_MARKET_CONTRACT not set and no deployment artifact found.");
}

const MarketCreatedABI = parseAbiItem(
  "event MarketCreated(uint256 indexed marketId,string question)",
);
const LiquidityAddedABI = parseAbiItem(
  "event LiquidityAdded(uint256 indexed marketId,uint256 amount)",
);
const BoughtABI = parseAbiItem(
  "event Bought(uint256 indexed marketId,uint8 outcome,uint256 amountIn,uint256 sharesOut,address buyer)",
);
const SoldABI = parseAbiItem(
  "event Sold(uint256 indexed marketId,uint8 outcome,uint256 sharesIn,uint256 amountOut,address seller)",
);
const ResolvedABI = parseAbiItem(
  "event Resolved(uint256 indexed marketId,uint8 outcome)",
);
const SettlementProcessedABI = parseAbiItem(
  "event SettlementProcessed(uint256 indexed marketId,address user,uint256 reward)",
);
const RedeemedABI = parseAbiItem(
  "event Redeemed(address indexed user,uint256 amount)",
);

async function main() {
  const command = process.argv[2] || "help";
  const arg = process.argv[3];
  const contract = resolveContractAddress();

  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  if (command === "events") {
    await checkRecentEvents(publicClient, contract);
    return;
  }

  if (command === "help") {
    printHelp();
    return;
  }

  const account = privateKeyToAccount(normalizePrivateKey(process.env.PRIVATE_KEY));
  const sdk = new SDK({
    public: publicClient,
    wallet: createWalletClient({
      account,
      chain: somniaTestnet,
      transport: http(),
    }),
  });

  switch (command) {
    case "check":
      if (!arg) throw new Error("Usage: check <subscriptionId>");
      await checkSubscription(sdk, BigInt(arg));
      break;
    case "cancel":
      if (!arg) throw new Error("Usage: cancel <subscriptionId>");
      await cancelSubscription(sdk, BigInt(arg));
      break;
    default:
      printHelp();
  }
}

async function checkSubscription(sdk: SDK, subId: bigint) {
  const info = await sdk.getSubscriptionInfo(subId);
  if (info instanceof Error) {
    console.error("❌ Subscription not found");
    return;
  }
  console.log("✅ Subscription ACTIVE");
  console.log(
    JSON.stringify(
      info,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    ),
  );
}

async function cancelSubscription(sdk: SDK, subId: bigint) {
  const tx = await sdk.cancelSoliditySubscription(subId);
  if (tx instanceof Error) {
    console.error("❌ Cancel failed:", tx.message);
    return;
  }
  console.log("✅ Subscription canceled");
  console.log(`Explorer: https://shannon-explorer.somnia.network/tx/${tx}`);
}

async function checkRecentEvents(
  publicClient: ReturnType<typeof createPublicClient>,
  contract: `0x${string}`,
) {
  const latest = await publicClient.getBlockNumber();
  const from = latest > 300n ? latest - 300n : 0n;

  console.log(`Scanning ${from} -> ${latest}`);
  console.log(`Contract: ${contract}`);

  const [created, liquidity, bought, sold, resolved, processed, redeemed] = await Promise.all([
    publicClient.getLogs({
      address: contract,
      event: MarketCreatedABI,
      fromBlock: from,
      toBlock: latest,
    }),
    publicClient.getLogs({
      address: contract,
      event: LiquidityAddedABI,
      fromBlock: from,
      toBlock: latest,
    }),
    publicClient.getLogs({
      address: contract,
      event: BoughtABI,
      fromBlock: from,
      toBlock: latest,
    }),
    publicClient.getLogs({
      address: contract,
      event: SoldABI,
      fromBlock: from,
      toBlock: latest,
    }),
    publicClient.getLogs({
      address: contract,
      event: ResolvedABI,
      fromBlock: from,
      toBlock: latest,
    }),
    publicClient.getLogs({
      address: contract,
      event: SettlementProcessedABI,
      fromBlock: from,
      toBlock: latest,
    }),
    publicClient.getLogs({
      address: contract,
      event: RedeemedABI,
      fromBlock: from,
      toBlock: latest,
    }),
  ]);

  console.log("\nMarketCreated:");
  if (created.length === 0) {
    console.log("  (none)");
  } else {
    created.forEach((e, i) => {
      console.log(`  ${i + 1}. marketId=${e.args.marketId?.toString()} question=${e.args.question}`);
    });
  }

  console.log("\nLiquidityAdded:");
  if (liquidity.length === 0) {
    console.log("  (none)");
  } else {
    liquidity.forEach((e, i) => {
      console.log(`  ${i + 1}. marketId=${e.args.marketId?.toString()} amount=${e.args.amount?.toString()}`);
    });
  }

  console.log("\nBought:");
  if (bought.length === 0) {
    console.log("  (none)");
  } else {
    bought.forEach((e, i) => {
      console.log(
        `  ${i + 1}. marketId=${e.args.marketId?.toString()} outcome=${e.args.outcome?.toString()} amountIn=${e.args.amountIn?.toString()} sharesOut=${e.args.sharesOut?.toString()} buyer=${e.args.buyer}`,
      );
    });
  }

  console.log("\nSold:");
  if (sold.length === 0) {
    console.log("  (none)");
  } else {
    sold.forEach((e, i) => {
      console.log(
        `  ${i + 1}. marketId=${e.args.marketId?.toString()} outcome=${e.args.outcome?.toString()} sharesIn=${e.args.sharesIn?.toString()} amountOut=${e.args.amountOut?.toString()} seller=${e.args.seller}`,
      );
    });
  }

  console.log("\nResolved:");
  if (resolved.length === 0) {
    console.log("  (none)");
  } else {
    resolved.forEach((e, i) => {
      console.log(
        `  ${i + 1}. marketId=${e.args.marketId?.toString()} outcome=${e.args.outcome?.toString()}`,
      );
    });
  }

  console.log("\nSettlementProcessed (reactive settled):");
  if (processed.length === 0) {
    console.log("  (none) -> reactive execution may still be pending");
  } else {
    processed.forEach((e, i) => {
      console.log(
        `  ${i + 1}. marketId=${e.args.marketId?.toString()} user=${e.args.user} reward=${e.args.reward?.toString()}`,
      );
    });
  }

  console.log("\nRedeemed:");
  if (redeemed.length === 0) {
    console.log("  (none)");
  } else {
    redeemed.forEach((e, i) => {
      console.log(
        `  ${i + 1}. user=${e.args.user} amount=${e.args.amount?.toString()}`,
      );
    });
  }
}

function printHelp() {
  console.log("\nUsage:");
  console.log("  npm run manage-subscription -- events");
  console.log("  npm run manage-subscription -- check <subscriptionId>");
  console.log("  npm run manage-subscription -- cancel <subscriptionId>");
}

main().catch((err) => {
  console.error("❌ manage-subscription failed");
  console.error(err);
  process.exit(1);
});
