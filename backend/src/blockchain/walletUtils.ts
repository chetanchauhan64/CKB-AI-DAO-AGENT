import {
  initializeConfig,
  predefined,
  getConfig,
} from '@ckb-lumos/config-manager';
import { parseAddress, generateAddress } from '@ckb-lumos/helpers';
import { key } from '@ckb-lumos/hd';
import { env } from '../config/env';
import { getIndexer, getRPC } from './ckbClient';
import { shannonsToCKB, isDepositCell } from '../utils/formatter';
import { CKB_TESTNET_CONFIG } from '../config/ckb';
import type { Cell } from '@ckb-lumos/base';
import type { DaoCell } from '../../../shared/types/dao';
import { logger } from '../utils/logger';

// Initialize lumos config once
let configInitialized = false;
export function ensureLumosConfig() {
  if (!configInitialized) {
    initializeConfig(predefined.AGGRON4); // Testnet
    configInitialized = true;
  }
}

/** Derive secp256k1 address from private key */
export function getAddressFromPrivateKey(privateKey: string): string {
  ensureLumosConfig();
  const config = getConfig();
  const pk = `0x${privateKey.replace(/^0x/, '')}`;
  const pubKey = key.privateToPublic(pk);
  const args = key.publicKeyToBlake160(pubKey);
  const template = config.SCRIPTS.SECP256K1_BLAKE160!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args,
  };
  return generateAddress(lockScript);
}

/** Get the agent's wallet address */
let _walletAddress: string | null = null;
export function getWalletAddress(): string {
  if (!_walletAddress) {
    _walletAddress = getAddressFromPrivateKey(env.walletPrivateKey);
    logger.info({ address: _walletAddress }, 'Wallet address derived');
  }
  return _walletAddress;
}

/** Get CKB balance for an address (returns shannons as bigint) */
export async function getBalanceShannons(address: string): Promise<bigint> {
  ensureLumosConfig();
  const config = getConfig();
  const indexer = getIndexer();

  const lockScript = parseAddress(address, { config });
  let total = 0n;

  const collector = indexer.collector({ lock: lockScript, type: 'empty' });
  for await (const cell of collector.collect()) {
    total += BigInt(cell.cellOutput.capacity);
  }
  return total;
}

/** Get all live cells for an address */
export async function getLiveCells(address: string): Promise<Cell[]> {
  ensureLumosConfig();
  const config = getConfig();
  const indexer = getIndexer();
  const lockScript = parseAddress(address, { config });
  const cells: Cell[] = [];
  const collector = indexer.collector({ lock: lockScript });
  for await (const cell of collector.collect()) {
    cells.push(cell);
  }
  return cells;
}

/** Get all DAO cells for an address, with status */
export async function getDAOCells(address: string): Promise<DaoCell[]> {
  ensureLumosConfig();
  const config = getConfig();
  const indexer = getIndexer();
  const rpc = getRPC();

  const lockScript = parseAddress(address, { config });
  const daoTypeScript = {
    codeHash: CKB_TESTNET_CONFIG.DAO.CODE_HASH,
    hashType: CKB_TESTNET_CONFIG.DAO.HASH_TYPE,
    args: '0x',
  };

  const cells: DaoCell[] = [];

  const collector = indexer.collector({ lock: lockScript, type: daoTypeScript });

  // Get current epoch for calculations
  const tipHeader = await rpc.getTipHeader();
  const currentEpochHex = tipHeader.epoch;

  for await (const cell of collector.collect()) {
    const capacity = BigInt(cell.cellOutput.capacity);
    const isDeposit = isDepositCell(cell.data);

    const daoCell: DaoCell = {
      outPoint: cell.outPoint!,
      capacity: cell.cellOutput.capacity,
      capacityCKB: shannonsToCKB(capacity),
      status: isDeposit ? 'deposited' : 'withdrawing',
    };

    cells.push(daoCell);
  }

  return cells;
}

/** Sign a message hash with the wallet's private key */
export function signMessage(messageHash: string): string {
  const pk = `0x${env.walletPrivateKey.replace(/^0x/, '')}`;
  return key.signRecoverable(messageHash, pk);
}
