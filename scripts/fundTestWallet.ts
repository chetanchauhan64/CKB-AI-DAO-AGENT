/**
 * fundTestWallet.ts
 * Utility to display the wallet address and print instructions for the CKB Faucet.
 * Usage: Execute from the backend folder using: npx ts-node ../scripts/fundTestWallet.ts
 */

import { getAddress, getBalance } from '../backend/src/services/walletService';
// Import env to load the private key
import '../backend/src/config/env';

async function main() {
  try {
    console.log('=== 🏦 CKB Testnet Faucet Utility ===\n');
    
    // Get wallet address
    const { address } = getAddress();
    console.log(`Your Agent's Testnet Wallet Address is:`);
    console.log(`\n    👉 ${address} \n`);
    
    // Get current balance
    const balanceInfo = await getBalance();
    console.log(`Current Balance: ${balanceInfo.ckbBalance} CKB`);
    console.log('--------------------------------------------------');
    
    console.log('\nTo fund this wallet for testing:');
    console.log('1. Go to the Nervos Pudge Faucet: https://faucet.nervos.org/');
    console.log('2. Paste the address above.');
    console.log('3. Claim your testnet CKB.');
    
    console.log('\n[Simulated Funding Step]');
    console.log('Waiting for deposit confirmation... (This is a mock log. Real funds arrive in ~30s after faucet use.)');
    
    setTimeout(() => {
      console.log('✅ Simulation Complete: Check `npx ts-node ../scripts/checkDAOStatus.ts` later to verify real incoming balances.');
    }, 2000);

  } catch (err: any) {
    console.error('❌ Error initializing wallet. Did you configure backend/.env?');
    console.error(err.message);
  }
}

main().catch(console.error);
