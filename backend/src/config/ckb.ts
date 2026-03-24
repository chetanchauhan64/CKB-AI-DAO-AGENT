// CKB Testnet script hashes and constants
// Source: https://github.com/nervosnetwork/ckb/blob/develop/resource/specs/testnet.toml

export const CKB_TESTNET_CONFIG = {
  PREFIX: 'ckt',

  // SECP256K1 lock script (default lock)
  SECP256K1: {
    CODE_HASH: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    HASH_TYPE: 'type' as const,
    TX_HASH: '0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c',
    INDEX: '0x0',
    DEP_TYPE: 'depGroup' as const,
  },

  // Nervos DAO type script
  DAO: {
    CODE_HASH: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
    HASH_TYPE: 'type' as const,
    TX_HASH: '0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c',
    INDEX: '0x2',
    DEP_TYPE: 'code' as const,
  },
} as const;

// DAO constants
export const DAO_CONSTANTS = {
  // Minimum deposit: 102 CKB in shannons
  MIN_DEPOSIT_SHANNONS: 102n * 100_000_000n,
  // Occupied capacity of a DAO cell: ~102 CKB
  OCCUPIED_CAPACITY_SHANNONS: 102n * 100_000_000n,
  // Lock period: 180 epochs
  LOCK_PERIOD_EPOCHS: 180n,
  // Shannon per CKB
  SHANNON_PER_CKB: 100_000_000n,
} as const;
