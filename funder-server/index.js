require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { JsonRpcProvider, Wallet, Contract, parseUnits } = require('ethers');

// ── Config (loaded from environment variables) ──────────────────
const PORT = process.env.PORT || 3001;
const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
const RPC_URL = process.env.RPC_URL || 'https://dream-rpc.somnia.network/';
const COLLATERAL_ADDRESS = process.env.COLLATERAL_ADDRESS || '0x6D6eD86155CA2BF79e12b2499e0a9bd3563A1C4f';

if (!DEPLOYER_KEY) {
  console.error('ERROR: DEPLOYER_KEY environment variable is required');
  console.error('Create a .env file in this folder with:');
  console.error('  DEPLOYER_KEY=0xYOUR_PRIVATE_KEY_HERE');
  process.exit(1);
}

const MINT_ABI = ['function mint(address to, uint256 amount) public'];
const TFY_AMOUNT = parseUnits('1000', 18);  // 1000 TFY per new wallet
const STT_AMOUNT = parseUnits('0.5', 18);   // 0.5 STT for gas

const provider = new JsonRpcProvider(RPC_URL);
const deployer = new Wallet(DEPLOYER_KEY, provider);

// Rate limit: 1 fund per address
const funded = new Set();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Prediction Market Funder API' });
});

app.post('/fund', async (req, res) => {
  const { address } = req.body;

  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return res.status(400).json({ error: 'Invalid address' });
  }

  if (funded.has(address.toLowerCase())) {
    return res.json({ tfy: false, stt: false, message: 'Already funded' });
  }

  console.log(`[Fund] Funding ${address}...`);
  let stt = false, tfy = false;

  try {
    const tx = await deployer.sendTransaction({ to: address, value: STT_AMOUNT });
    await tx.wait();
    stt = true;
    console.log(`[Fund] STT sent to ${address}`);
  } catch (e) {
    console.error(`[Fund] STT failed:`, e.message);
  }

  try {
    const token = new Contract(COLLATERAL_ADDRESS, MINT_ABI, deployer);
    const tx = await token.mint(address, TFY_AMOUNT);
    await tx.wait();
    tfy = true;
    console.log(`[Fund] TFY minted to ${address}`);
  } catch (e) {
    console.error(`[Fund] TFY mint failed:`, e.message);
  }

  if (stt || tfy) {
    funded.add(address.toLowerCase());
  }

  res.json({ stt, tfy });
});

app.listen(PORT, () => {
  console.log(`\n🏦 Funder API running on http://localhost:${PORT}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Chain:    Somnia Testnet (50312)\n`);
});
