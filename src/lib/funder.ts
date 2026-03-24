import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import { RPC_URL, COLLATERAL_ADDRESS } from './config';

/**
 * Fund a new wallet with STT (gas) + TFY (trading tokens).
 *
 * DEV MODE:  Uses hardcoded deployer key (fine for testnet dev builds)
 * PROD MODE: Set EXPO_PUBLIC_FUNDER_API to your serverless endpoint URL
 *            The API holds the key securely as an env secret
 */

const FUNDER_API = process.env.EXPO_PUBLIC_FUNDER_API ?? '';

// ── Dev mode: direct on-chain from deployer key ─────────────────
const DEPLOYER_KEY = '0x4fbf5e3afcee8c9c4fc0f074413bf603aab3dfd80be9c299545cda692c750cd4';
const MINT_ABI = ['function mint(address to, uint256 amount) public'];
const TFY_AMOUNT = parseUnits('1000', 18);
const STT_AMOUNT = parseUnits('0.5', 18);

async function fundDirect(address: string): Promise<{ tfy: boolean; stt: boolean }> {
  const provider = new JsonRpcProvider(RPC_URL);
  const deployer = new Wallet(DEPLOYER_KEY, provider);
  let tfy = false, stt = false;

  try {
    const tx = await deployer.sendTransaction({ to: address, value: STT_AMOUNT });
    await tx.wait();
    stt = true;
  } catch (e) { console.warn('[Funder] STT failed:', e); }

  try {
    const token = new Contract(COLLATERAL_ADDRESS, MINT_ABI, deployer);
    const tx = await token.mint(address, TFY_AMOUNT);
    await tx.wait();
    tfy = true;
  } catch (e) { console.warn('[Funder] TFY failed:', e); }

  return { tfy, stt };
}

// ── Prod mode: call serverless API ──────────────────────────────
async function fundViaAPI(address: string): Promise<{ tfy: boolean; stt: boolean }> {
  const res = await fetch(FUNDER_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  return res.json();
}

// ── Public function ─────────────────────────────────────────────
export async function fundNewWallet(address: string): Promise<{ tfy: boolean; stt: boolean }> {
  console.log('[Funder] Funding wallet:', address);
  const result = FUNDER_API ? await fundViaAPI(address) : await fundDirect(address);
  console.log('[Funder] Result:', result);
  return result;
}
