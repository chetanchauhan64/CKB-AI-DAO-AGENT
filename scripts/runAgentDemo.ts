/**
 * runAgentDemo.ts
 * Utility to simulate the complete multi-agent workflow in the console.
 * Usage: Execute from the backend folder using: npx ts-node ../scripts/runAgentDemo.ts
 */

import { getAddress, getBalance } from '../backend/src/services/walletService';
import '../backend/src/config/env';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Agent Workflow Simulation Demo\n');
  
  // 1. Initial State
  const { address } = getAddress();
  console.log('--- [Wallet Agent: Initialization] ---');
  console.log(`Target Wallet: ${address}`);
  let currentBalance = '0.0';
  
  try {
    const stats = await getBalance();
    currentBalance = stats.ckbBalance;
    console.log(`Confirmed Balance: ${currentBalance} CKB`);
  } catch (err) {
    console.log('Starting with mock balance: 10000.0 CKB');
    currentBalance = '10000.0';
  }

  await delay(1500);

  // 2. Strategy Engine
  console.log('\n--- [Strategy Engine: Recommendation] ---');
  console.log('Querying current Nervos DAO APY projections...');
  await delay(1000);
  console.log('💡 APY is currently ~2.5%. Market conditions are stable.');
  console.log('💡 Recommendation: Deposit 5000 CKB into the DAO to maximize yield compound over the next epoch.');

  await delay(2000);

  // 3. Simulated DAO Action
  console.log('\n--- [DAO Agent: Execution] ---');
  console.log('[Simulation Mode: Transactions are MOCKED and not broadcast over the network]');
  console.log('Validating UTXOs for 5000 CKB deposit...');
  await delay(1000);
  console.log('Constructing DAO cell (Type: nervos_dao)...');
  await delay(1000);
  console.log('Transaction signed by Wallet Agent.');
  console.log('✅ [Simulated] Transaction Broadcasted! TxHash: 0xaaabbbcccdddeee111222333...');

  await delay(1500);

  // 4. Simulate Harvest Loop
  console.log('\n--- [Yield Harvester: Epoch Simulation] ---');
  console.log('Fast-forwarding simulated time by 200 Epochs...');
  await delay(1500);
  console.log('Yield threshold reached. Calculating estimated rewards...');
  console.log('Accrued Yield: +15.5 CKB');
  
  await delay(1000);
  console.log('Triggering Phase 1 Withdrawal...');
  console.log('✅ [Simulated] Phase 1 Broadcasted! TxHash: 0xeeefffggg...');
  
  await delay(1000);
  console.log('Wait period completed. Triggering Phase 2 Unlock...');
  console.log('✅ [Simulated] Phase 2 Broadcasted! Funds returned to wallet.');
  
  console.log('\n🎉 Demo Workflow Completed Successfully!');
}

main().catch(console.error);
