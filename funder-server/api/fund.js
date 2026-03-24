const { JsonRpcProvider, Wallet, Contract, parseUnits } = require('ethers');

const RPC_URL = process.env.RPC_URL || 'https://dream-rpc.somnia.network/';
const COLLATERAL_ADDRESS = process.env.COLLATERAL_ADDRESS || '0x6D6eD86155CA2BF79e12b2499e0a9bd3563A1C4f';
const DEPLOYER_KEY = process.env.DEPLOYER_KEY;

const MINT_ABI = ['function mint(address to, uint256 amount) public'];
const TFY_AMOUNT = parseUnits('10', 18);   // 10 TFY for testing
const STT_AMOUNT = parseUnits('0.01', 18); // 0.01 STT for testing

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!DEPLOYER_KEY) return res.status(500).json({ error: 'Server not configured' });

  const { address } = req.body;
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return res.status(400).json({ error: 'Invalid address' });
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const deployer = new Wallet(DEPLOYER_KEY, provider);

  let stt = false, tfy = false;

  try {
    const tx = await deployer.sendTransaction({ to: address, value: STT_AMOUNT });
    await tx.wait();
    stt = true;
  } catch (e) { console.error('STT failed:', e.message); }

  try {
    const token = new Contract(COLLATERAL_ADDRESS, MINT_ABI, deployer);
    const tx = await token.mint(address, TFY_AMOUNT);
    await tx.wait();
    tfy = true;
  } catch (e) { console.error('TFY failed:', e.message); }

  res.json({ stt, tfy });
};
