import hre from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Deploying PredictionMarket");
  console.log("Network   :", network.name);
  console.log("Deployer  :", deployer.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Balance   :", ethers.formatEther(bal), "STT");

  const resolver = process.env.PREDICTION_MARKET_RESOLVER ?? deployer.address;
  const feeBpsRaw = process.env.PREDICTION_MARKET_FEE_BPS ?? "200";
  const feeBps = BigInt(feeBpsRaw);
  const mintAmountRaw = process.env.PREDICTION_MARKET_MINT ?? "1000000";
  const mintAmount = ethers.parseUnits(mintAmountRaw, 18);

  console.log("Resolver  :", resolver);
  console.log("Fee (bps) :", feeBps.toString());
  console.log("Mint to admin:", `${mintAmountRaw} (18 decimals)`);

  const CollateralFactory = await ethers.getContractFactory("Collateral");
  const collateralToken = await CollateralFactory.deploy(deployer.address);
  await collateralToken.waitForDeployment();
  const collateral = await collateralToken.getAddress();

  console.log("\n✅ Collateral deployed");
  console.log("Collateral:", collateral);

  const mintTx = await collateralToken.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Mint tx   :", mintTx.hash);

  const Factory = await ethers.getContractFactory("PredictionMarket");
  const contract = await Factory.deploy(collateral, resolver, feeBps);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash ?? "";

  console.log("\n✅ PredictionMarket deployed");
  console.log("Address   :", address);
  if (txHash) console.log("Tx Hash   :", txHash);
  console.log(
    "Explorer  :",
    `https://shannon-explorer.somnia.network/address/${address}`,
  );

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);
  const payload = {
    contractName: "PredictionMarket",
    address,
    deploymentTx: txHash,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    network: network.name,
    collateral,
    resolver,
    feeBps: feeBps.toString(),
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));

  console.log("\n📝 Saved deployment artifact:");
  console.log(outFile);
  console.log("\nSet these in .env:");
  console.log(`PREDICTION_MARKET_CONTRACT=${address}`);
  console.log(`PREDICTION_MARKET_COLLATERAL=${collateral}`);
  console.log(`PREDICTION_MARKET_RESOLVER=${resolver}`);
  console.log(`PREDICTION_MARKET_FEE_BPS=${feeBps.toString()}`);
  console.log(`PREDICTION_MARKET_MINT=${mintAmountRaw}`);
}

main().catch((error) => {
  console.error("Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});
