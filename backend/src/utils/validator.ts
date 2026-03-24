/**
 * validator.ts
 * Input validation helpers used by all Express routes.
 * Returns a human-readable error string on failure, or null on success.
 */

const CKB_TESTNET_PREFIX = 'ckt';
const CKB_MAINNET_PREFIX = 'ckb';
const TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;

/**
 * Validates a CKB address (testnet starts with "ckt", mainnet with "ckb").
 */
export function validateAddress(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return 'address must be a non-empty string';
  }
  if (
    !address.startsWith(CKB_TESTNET_PREFIX) &&
    !address.startsWith(CKB_MAINNET_PREFIX)
  ) {
    return `address must start with "ckt" (testnet) or "ckb" (mainnet), got: ${address.slice(0, 10)}`;
  }
  if (address.length < 46 || address.length > 100) {
    return `address length is unexpected (${address.length} chars)`;
  }
  return null;
}

/**
 * Validates an amount in CKB. Must be a positive finite number >= minCKB.
 */
export function validateAmount(amount: unknown, minCKB = 0): string | null {
  if (typeof amount !== 'number' || !isFinite(amount) || isNaN(amount)) {
    return 'amount_ckb must be a finite number';
  }
  if (amount <= 0) return 'amount_ckb must be greater than 0';
  if (minCKB > 0 && amount < minCKB) {
    return `amount_ckb must be at least ${minCKB} CKB`;
  }
  return null;
}

/**
 * Validates a 64-byte transaction hash (66 chars with 0x prefix).
 */
export function validateTxHash(hash: string): string | null {
  if (!hash || typeof hash !== 'string') {
    return 'tx_hash must be a non-empty string';
  }
  if (!TX_HASH_REGEX.test(hash)) {
    return `tx_hash must be a 0x-prefixed 64-char hex string, got: ${hash.slice(0, 20)}`;
  }
  return null;
}

/**
 * Validates a cron expression string using a simple heuristic (node-cron format).
 */
export function validateCronExpression(expr: string): string | null {
  if (!expr || typeof expr !== 'string') return 'cron expression must be a string';
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    return 'cron expression must have 5 or 6 fields (min hr dom mon dow [sec])';
  }
  return null;
}

/**
 * Collect validation errors and return them as a single formatted message.
 * Usage: assertValid({ field: validator(value), ... })
 */
export function assertValid(checks: Record<string, string | null>): void {
  const errors = Object.entries(checks)
    .filter(([, err]) => err !== null)
    .map(([field, err]) => `${field}: ${err}`);
  if (errors.length > 0) {
    const err = new Error(errors.join('; ')) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
}
