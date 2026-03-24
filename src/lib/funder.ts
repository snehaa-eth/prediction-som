import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import { RPC_URL, COLLATERAL_ADDRESS } from './config';

/**
 * Fund a new wallet with TFY tokens from the deployer.
 * The deployer key is hardcoded here for testnet convenience.
 * In production, this would be a backend API call.
 */
const DEPLOYER_KEY = '0x4fbf5e3afcee8c9c4fc0f074413bf603aab3dfd80be9c299545cda692c750cd4';

const MINT_ABI = [
  'function mint(address to, uint256 amount) public',
];

const TFY_AMOUNT = parseUnits('1000', 18); // 1000 TFY
const STT_AMOUNT = parseUnits('0.5', 18);  // 0.5 STT for gas

export async function fundNewWallet(address: string): Promise<{ tfy: boolean; stt: boolean }> {
  const provider = new JsonRpcProvider(RPC_URL);
  const deployer = new Wallet(DEPLOYER_KEY, provider);

  let tfy = false;
  let stt = false;

  try {
    // Send STT for gas
    const sttTx = await deployer.sendTransaction({
      to: address,
      value: STT_AMOUNT,
    });
    await sttTx.wait();
    stt = true;
  } catch {
    // deployer might not have enough STT
  }

  try {
    // Mint TFY
    const token = new Contract(COLLATERAL_ADDRESS, MINT_ABI, deployer);
    const mintTx = await token.mint(address, TFY_AMOUNT);
    await mintTx.wait();
    tfy = true;
  } catch {
    // mint might fail if deployer isn't owner
  }

  return { tfy, stt };
}
