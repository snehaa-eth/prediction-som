import { SDK } from "@somnia-chain/reactivity";
import { privateKeyToAccount } from "viem/accounts";
import { somniaTestnet } from "viem/chains";
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  parseGwei,
  toBytes,
} from "viem";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

function normalizePrivateKey(raw?: string): `0x${string}` {
  if (!raw) throw new Error("PRIVATE_KEY not found in .env");
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
}

function resolveContractAddress(): `0x${string}` {
  const fromEnv = process.env.PREDICTION_MARKET_CONTRACT;
  if (fromEnv) return fromEnv as `0x${string}`;

  const fromDeployment = path.join(__dirname, "..", "deployments", "somniaTestnet.json");
  if (fs.existsSync(fromDeployment)) {
    const json = JSON.parse(fs.readFileSync(fromDeployment, "utf8"));
    if (json.address) return json.address as `0x${string}`;
  }

  throw new Error("PREDICTION_MARKET_CONTRACT not found. Deploy first or set .env value.");
}

async function main() {
  const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY);
  const account = privateKeyToAccount(privateKey);
  const contract = resolveContractAddress();
  const emitter = (process.env.PREDICTION_MARKET_EMITTER || contract) as `0x${string}`;

  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });
  const walletClient = createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(),
  });
  const sdk = new SDK({ public: publicClient, wallet: walletClient });

  const balance = await publicClient.getBalance({ address: account.address });
  const stt = Number(balance) / 1e18;
  console.log("Account :", account.address);
  console.log("Balance :", stt.toFixed(4), "STT");
  if (stt < 32) throw new Error("Minimum 32 STT required for subscription ownership.");

  const resolvedSig = keccak256(
    toBytes("Resolved(uint256,uint8)"),
  );

  const subData = {
    handlerContractAddress: contract,
    emitter,
    eventTopics: [resolvedSig],
    priorityFeePerGas: parseGwei("2"),
    maxFeePerGas: parseGwei("10"),
    gasLimit: 3_000_000n,
    isGuaranteed: true,
    isCoalesced: false,
  };

  console.log("\nCreating subscription for PredictionMarket...");
  console.log("Handler  :", contract);
  console.log("Emitter  :", emitter);
  console.log("EventSig :", resolvedSig);

  const txHash = await sdk.createSoliditySubscription(subData);
  if (txHash instanceof Error) throw txHash;

  console.log("Subscription tx:", txHash);
  console.log(`Explorer: https://shannon-explorer.somnia.network/tx/${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  const topic2 = receipt.logs[0]?.topics?.[2];
  if (!topic2) throw new Error("Could not extract subscription ID from tx logs.");
  const subscriptionId = BigInt(topic2);

  console.log("Subscription ID:", subscriptionId.toString());

  const info = await sdk.getSubscriptionInfo(subscriptionId);
  if (!(info instanceof Error)) {
    console.log(
      JSON.stringify(
        info,
        (_, v) => (typeof v === "bigint" ? v.toString() : v),
        2,
      ),
    );
  }
}

main().catch((err) => {
  console.error("❌ create-subscription failed");
  console.error(err);
  process.exit(1);
});
