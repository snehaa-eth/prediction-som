/**
 * Fund new wallets via API — no private keys in app code.
 * Dev:  run `node funder-server/index.js` locally
 * Prod: deploy funder-server to Render.com / Railway
 */

const FUNDER_API = process.env.EXPO_PUBLIC_FUNDER_API ?? 'http://localhost:3001/fund';

export async function fundNewWallet(address: string): Promise<{ tfy: boolean; stt: boolean }> {
  console.log('[Funder] Requesting funds for:', address);
  try {
    const res = await fetch(FUNDER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    const result = await res.json();
    console.log('[Funder] Result:', result);
    return result;
  } catch (e) {
    console.warn('[Funder] Failed to reach funder API:', e);
    return { tfy: false, stt: false };
  }
}
