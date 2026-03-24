import { BI } from '@ckb-lumos/bi';
import { DAO_CONSTANTS } from '../config/ckb';

/** Convert shannons (bigint) to CKB string with 8 decimal places */
export function shannonsToCKB(shannons: bigint): string {
  const abs = shannons < 0n ? -shannons : shannons;
  const ckb = abs / DAO_CONSTANTS.SHANNON_PER_CKB;
  const remainder = abs % DAO_CONSTANTS.SHANNON_PER_CKB;
  const sign = shannons < 0n ? '-' : '';
  if (remainder === 0n) return `${sign}${ckb}`;
  const paddedRemainder = remainder.toString().padStart(8, '0').replace(/0+$/, '');
  return `${sign}${ckb}.${paddedRemainder}`;
}

/** Convert CKB amount (number or string) to shannons (bigint) */
export function ckbToShannons(ckb: number | string): bigint {
  const [intPart, fracPart = ''] = String(ckb).split('.');
  const paddedFrac = fracPart.padEnd(8, '0').slice(0, 8);
  return BigInt(intPart) * DAO_CONSTANTS.SHANNON_PER_CKB + BigInt(paddedFrac);
}

/** Format a big number as hex with 0x prefix, padded to byteLength bytes */
export function toHexPadded(value: bigint, byteLength: number): string {
  const hex = value.toString(16).padStart(byteLength * 2, '0');
  return '0x' + hex;
}

/** Convert capacity hex string to shannons bigint */
export function capacityToShannons(capacityHex: string): bigint {
  return BigInt(capacityHex);
}

/** Encode uint64 as little-endian 8-byte hex (for DAO cell data) */
export function encodeUint64LE(value: bigint): string {
  const hex = value.toString(16).padStart(16, '0');
  const bytes = hex.match(/.{2}/g)!.reverse().join('');
  return '0x' + bytes;
}

/** Decode little-endian uint64 from 8-byte hex */
export function decodeUint64LE(hexStr: string): bigint {
  const hex = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
  const bytes = hex.match(/.{2}/g)!.reverse().join('');
  return BigInt('0x' + bytes);
}

/** Check if a DAO cell is a deposit cell (data = 8 zero bytes) */
export function isDepositCell(data: string): boolean {
  return data === '0x0000000000000000' || data === '0x';
}

/** Format txHash for display */
export function shortTxHash(txHash: string): string {
  return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
}
