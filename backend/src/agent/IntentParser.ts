import type { IntentType, ParsedIntent } from '../../../shared/types/agent';

/**
 * IntentParser: fast regex-based NL classifier before hitting Claude.
 * Handles common, unambiguous commands to save token budget and latency.
 */

interface IntentRule {
  patterns: RegExp[];
  intent: IntentType;
  extractParams?: (msg: string) => Record<string, unknown>;
}

// Amount extractor: finds numbers like 500, 500.5, 1000 CKB
const extractAmount = (msg: string): Record<string, unknown> => {
  const match = msg.match(/(\d+(?:\.\d+)?)\s*(?:ckb)?/i);
  return match ? { amount_ckb: parseFloat(match[1]) } : {};
};

// TxHash extractor: find 0x... hashes
const extractTxHash = (msg: string): Record<string, unknown> => {
  const match = msg.match(/0x[0-9a-fA-F]{64}/);
  return match ? { tx_hash: match[0] } : {};
};

const INTENT_RULES: IntentRule[] = [
  // Balance / wallet
  {
    patterns: [/\b(balance|how much|wallet|funds?)\b/i],
    intent: 'check_balance',
    extractParams: () => ({}),
  },
  // Deposit
  {
    patterns: [/\bdeposit\b/i],
    intent: 'deposit',
    extractParams: extractAmount,
  },
  // Phase 1 withdraw (initiate)
  {
    patterns: [/\b(start|initiate|begin|request)\s+(withdraw|withdrawal)\b/i, /withdraw.*phase.?1/i],
    intent: 'withdraw_phase1',
    extractParams: extractTxHash,
  },
  // Phase 2 unlock (claim)
  {
    patterns: [
      /\b(unlock|claim|complete|finish)\s+(withdraw|withdrawal|dao|reward)\b/i,
      /withdraw.*phase.?2/i,
      /\bclaim\s+reward/i,
    ],
    intent: 'withdraw_phase2',
    extractParams: extractTxHash,
  },
  // List DAO cells
  {
    patterns: [/\b(list|show|view|see|my)\s+(dao|deposit)/i, /dao\s+cell/i],
    intent: 'list_dao_cells',
    extractParams: () => ({}),
  },
  // Epoch info
  {
    patterns: [/\b(epoch|cycle|lock\s*period|when\s+can\s+i\s+withdraw)/i],
    intent: 'get_epoch_info',
    extractParams: () => ({}),
  },
  // Calculate rewards
  {
    patterns: [/\b(reward|earn|interest|yield|profit|how\s+much\s+have\s+i)/i],
    intent: 'calculate_rewards',
    extractParams: extractTxHash,
  },
  // Schedule harvest
  {
    patterns: [/\b(auto|automat|schedule|enable.{0,20}harvest)/i],
    intent: 'schedule_harvest',
    extractParams: (msg) => {
      const match = msg.match(/(\d+)\s*epoch/i);
      return match ? { threshold_epochs: parseInt(match[1], 10) } : { threshold_epochs: 5 };
    },
  },
  // Explain DAO
  {
    patterns: [/\b(what is|explain|how does|tell me about)\b.{0,30}(dao|nervos|ckb)/i],
    intent: 'explain_dao',
    extractParams: () => ({}),
  },
];

export function parseIntent(message: string): ParsedIntent {
  const normalized = message.trim().toLowerCase();

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        return {
          intent: rule.intent,
          confidence: 0.85,
          params: rule.extractParams ? rule.extractParams(message) : {},
          rawMessage: message,
        };
      }
    }
  }

  // Fallback: let Claude decide
  return {
    intent: 'unknown',
    confidence: 0,
    params: {},
    rawMessage: message,
  };
}
