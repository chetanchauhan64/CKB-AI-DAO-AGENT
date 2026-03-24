/**
 * checkDAOStatus.ts
 * Utility to fetch and display the current DAO cells for the wallet.
 * Usage: Execute from the backend folder using: npx ts-node ../scripts/checkDAOStatus.ts
 */

import { getAddress } from '../backend/src/services/walletService';
import { listCells, rewardEstimate } from '../backend/src/services/daoService';
// Import env to load secrets if necessary for Lumos config
import '../backend/src/config/env';

async function main() {
  console.log('🔍 Checking DAO Status for Agent Wallet...');
  const { address } = getAddress();
  console.log(`📡 Wallet Address: ${address}\n`);

  try {
    const { cells, count } = await listCells();
    console.log(`Found ${count} Nervos DAO cells.\n`);

    if (count === 0) {
      console.log('No active DAO deposits found.');
      return;
    }

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const amountCKB = (BigInt(cell.capacity) / 100000000n).toString();
      console.log(`--- [Cell #${i + 1}] ---`);
      console.log(`Status:        ${cell.status.toUpperCase()}`);
      console.log(`TxHash:        ${cell.outPoint?.txHash} (Index: ${cell.outPoint?.index})`);
      console.log(`Deposited:     ${amountCKB} CKB`);
      
      try {
        if (cell.outPoint && cell.status === 'deposited') {
          const reward = await rewardEstimate(cell.outPoint.txHash, parseInt(cell.outPoint.index, 16));
          console.log(`Est. Compound: +${reward.estimatedRewardCKB} CKB`);
        } else {
          console.log('Est. Compound: N/A (Withdrawing/Unlocked)');
        }
      } catch (err) {
        console.log('Est. Compound: Calculation unavailable right now.');
      }
      console.log('');
    }
  } catch (err: any) {
    console.error(`❌ Failed to fetch DAO status: ${err.message}`);
  }
}

main().catch(console.error);
