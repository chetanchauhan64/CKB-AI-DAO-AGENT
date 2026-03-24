import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'deposit',
      description: 'Deposit CKB into the Nervos DAO. Minimum 102 CKB. Returns the transaction hash.',
      parameters: {
        type: 'object',
        properties: {
          amount_ckb: {
            type: 'number',
            description: 'Amount of CKB to deposit. Must be at least 102.',
          },
        },
        required: ['amount_ckb'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'withdraw_phase1',
      description: 'Initiate Phase 1 withdrawal from Nervos DAO. Transforms a deposit cell into a withdrawing cell. The user must provide the deposit transaction hash and output index.',
      parameters: {
        type: 'object',
        properties: {
          deposit_tx_hash: {
            type: 'string',
            description: 'Transaction hash of the DAO deposit transaction (0x + 64 hex chars).',
          },
          deposit_index: {
            type: 'number',
            description: 'Output index of the DAO deposit cell in the transaction (usually 0).',
          },
        },
        required: ['deposit_tx_hash', 'deposit_index'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'withdraw_phase2',
      description: 'Complete Phase 2 withdrawal from Nervos DAO. Claims deposited CKB plus rewards after the 180-epoch lock period has elapsed.',
      parameters: {
        type: 'object',
        properties: {
          withdraw_tx_hash: {
            type: 'string',
            description: 'Transaction hash of the Phase 1 withdrawal transaction.',
          },
          withdraw_index: {
            type: 'number',
            description: 'Output index of the withdrawing cell.',
          },
          deposit_tx_hash: {
            type: 'string',
            description: 'Original deposit transaction hash (needed for reward calculation).',
          },
          deposit_index: {
            type: 'number',
            description: 'Output index of the original deposit.',
          },
        },
        required: ['withdraw_tx_hash', 'withdraw_index', 'deposit_tx_hash', 'deposit_index'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_balance',
      description: 'Get the current CKB wallet balance and count of DAO deposits.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_dao_cells',
      description: 'List all Nervos DAO deposit and withdrawing cells for the wallet, with status, capacity, and epoch information.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_epoch_info',
      description: 'Get current CKB epoch number, progress within the epoch, and cycles remaining until the next DAO withdrawal window.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_rewards',
      description: 'Calculate estimated DAO rewards for a specific deposit. Returns deposit amount, accumulated reward, and total claimable CKB.',
      parameters: {
        type: 'object',
        properties: {
          deposit_tx_hash: {
            type: 'string',
            description: 'Transaction hash of the DAO deposit.',
          },
          deposit_index: {
            type: 'number',
            description: 'Output index of the deposit in the transaction.',
          },
        },
        required: ['deposit_tx_hash', 'deposit_index'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_harvest',
      description: 'Enable or disable automatic DAO yield harvesting.',
      parameters: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'Whether to enable or disable auto-harvest.',
          },
          threshold_epochs: {
            type: 'number',
            description: 'Number of epochs from cycle end to trigger auto-harvest. Default: 5.',
          },
        },
        required: ['enabled'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explain_dao',
      description: 'Explain how the Nervos DAO works, including deposit/withdrawal mechanics, lock periods, and reward calculation. Does not execute any transaction.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['overview', 'deposit', 'withdrawal', 'rewards', 'epochs', 'all'],
            description: 'Which aspect of the DAO to explain.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_ckb',
      description: 'Send CKB from the agent wallet to another address. Minimum transfer is 61 CKB.',
      parameters: {
        type: 'object',
        properties: {
          to_address: {
            type: 'string',
            description: 'Recipient CKB address (starts with ckt1 on testnet, ckb1 on mainnet).',
          },
          amount_ckb: {
            type: 'number',
            description: 'Amount of CKB to send. Minimum 61 CKB.',
          },
        },
        required: ['to_address', 'amount_ckb'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_preference',
      description: 'Memorize a user preference permanently. e.g. mapping an alias name to a CKB testnet wallet address ("Cold Wallet" -> "ckt1...").',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'The entity or concept being remembered (e.g. "Cold Wallet").',
          },
          value: {
            type: 'string',
            description: 'The corresponding value to associate forever.',
          },
        },
        required: ['key', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_automation_rule',
      description: 'Save a recurring intent or natural language automation rule the user has stated. e.g. "always harvest immediately when my Dao returns mature yield" it gets injected directly into memory for future LLM runs.',
      parameters: {
        type: 'object',
        properties: {
          rule_description: {
            type: 'string',
            description: 'A detailed prompt-like sentence instructing the AI on how to handle future network states autonomously.',
          },
        },
        required: ['rule_description'],
      },
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOL_NAMES = AGENT_TOOLS.map((t: any) => t.function.name);
