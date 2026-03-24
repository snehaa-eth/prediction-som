import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const MARKET_ABI = [
  "function collateral() view returns (address)",
  "function createMarket(string question) returns (uint256)",
  "function addLiquidity(uint256 marketId,uint256 amount)",
  "function marketCount() view returns (uint256)",
  "event MarketCreated(uint256 indexed marketId,string question)",
];

const ERC20_ABI = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

const MARKETS = [
  "Will Bitcoin reach $150k before 2027?",
  "Will Somnia mainnet launch in Q2 2026?",
  "Will Ethereum flip Bitcoin by market cap in 2026?",
  "Will AI replace 50% of coding jobs by 2028?",
  "Will SpaceX land humans on Mars before 2030?",
];

const LIQUIDITY = ethers.parseUnits("200", 18); // 200 TFY per market

async function main() {
  const p = path.join(__dirname, "..", "deployments", "somniaTestnet.json");
  const deployment = JSON.parse(fs.readFileSync(p, "utf8"));
  const [signer] = await ethers.getSigners();

  const market = new ethers.Contract(deployment.address, MARKET_ABI, signer);
  const token = new ethers.Contract(deployment.collateral, ERC20_ABI, signer);

  const bal = await token.balanceOf(signer.address);
  console.log(`Signer: ${signer.address}`);
  console.log(`TFY balance: ${ethers.formatUnits(bal, 18)}`);

  // Approve enough for all markets
  const totalNeeded = LIQUIDITY * BigInt(MARKETS.length);
  const allowance = await token.allowance(signer.address, deployment.address);
  if (allowance < totalNeeded) {
    console.log(`Approving ${ethers.formatUnits(totalNeeded, 18)} TFY...`);
    const tx = await token.approve(deployment.address, totalNeeded);
    await tx.wait();
  }

  for (const question of MARKETS) {
    console.log(`\nCreating: "${question}"`);

    const createTx = await market.createMarket(question);
    const receipt = await createTx.wait();
    const iface = new ethers.Interface(MARKET_ABI);
    const created = receipt?.logs
      ?.map((log: any) => { try { return iface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === "MarketCreated");

    if (!created) { console.log("  Failed to get marketId"); continue; }
    const marketId = created.args.marketId;
    console.log(`  Market ID: ${marketId}`);

    console.log(`  Adding ${ethers.formatUnits(LIQUIDITY, 18)} TFY liquidity...`);
    const liqTx = await market.addLiquidity(marketId, LIQUIDITY);
    await liqTx.wait();
    console.log(`  Done!`);
  }

  const count = await market.marketCount();
  console.log(`\nTotal markets on-chain: ${count}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
