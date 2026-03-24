// Deploy this as a Cloudflare Worker / Vercel Edge Function / any serverless
// Set DEPLOYER_KEY as an environment secret (not in code)

import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';

const RPC_URL = 'https://dream-rpc.somnia.network/';
const COLLATERAL_ADDRESS = '0x6D6eD86155CA2BF79e12b2499e0a9bd3563A1C4f';
const MINT_ABI = ['function mint(address to, uint256 amount) public'];
const TFY_AMOUNT = parseUnits('1000', 18);
const STT_AMOUNT = parseUnits('0.5', 18);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
      });
    }

    if (request.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405 });
    }

    const { address } = await request.json();
    if (!address || !address.startsWith('0x')) {
      return Response.json({ error: 'Invalid address' }, { status: 400 });
    }

    const provider = new JsonRpcProvider(RPC_URL);
    const deployer = new Wallet(env.DEPLOYER_KEY, provider);

    let stt = false, tfy = false;

    try {
      const tx = await deployer.sendTransaction({ to: address, value: STT_AMOUNT });
      await tx.wait();
      stt = true;
    } catch (e) { console.error('STT fund failed:', e.message); }

    try {
      const token = new Contract(COLLATERAL_ADDRESS, MINT_ABI, deployer);
      const tx = await token.mint(address, TFY_AMOUNT);
      await tx.wait();
      tfy = true;
    } catch (e) { console.error('TFY mint failed:', e.message); }

    return Response.json({ stt, tfy }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  },
};
