import 'dotenv/config';
import { ensureLumosConfig, getWalletAddress, getBalanceShannons } from '../src/blockchain/walletUtils';
import { shannonsToCKB } from '../src/utils/formatter';
import { depositToDAO } from '../src/blockchain/daoScripts';

async function main() {
  console.log('🔍 Starting CKB DAO Transaction Verification on Testnet...');
  
  ensureLumosConfig();
  console.log('✅ Lumos Config Initialized (Aggron4)');

  const address = getWalletAddress();
  console.log(`🏦 Derived Address: ${address}`);

  const balanceShannons = await getBalanceShannons(address);
  const balanceCkb = Number(shannonsToCKB(balanceShannons));
  console.log(`💰 Balance: ${balanceCkb} CKB`);

  if (balanceCkb < 105) {
    console.error('❌ Insufficient balance for testing a DAO deposit. Please fund the address from the faucet: https://faucet.nervos.org/');
    process.exit(1);
  }

  console.log('⚙️ Testing DAO Deposit Transaction Construction & Signature...');
  try {
    // Attempting to deposit the minimum amount (102 CKB)
    const result = await depositToDAO(102);
    console.log('✅ DAO Deposit Transaction Successfully Built, Signed, and Broadcasted!');
    console.log(`🔗 Transaction Hash: ${result.txHash}`);
    console.log(`🌐 View on Explorer: https://pudge.explorer.nervos.org/transaction/${result.txHash}`);
    console.log('\nNOTE: Phase 1 Withdraw and Phase 2 Unlock require the deposit to be mature on the blockchain.');
    console.log('They rely on the exact same lumos `signAndSendSkeleton` signature logic verified by this deposit.');
  } catch (err: unknown) {
    console.error('❌ Transaction Verification Failed:');
    console.error(err instanceof Error ? err.message : String(err));
  }
}

main().catch(console.error);
