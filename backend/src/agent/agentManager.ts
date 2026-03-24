export function getAgentFlow(intent: string, toolCalled?: string, hasStrategy?: boolean, hasExplanation?: boolean): string[] {
  const flow: string[] = [];
  
  // Strategy decisions, heuristics, or lack of strict explicit intent falls to the Strategy brain.
  if (hasStrategy || hasExplanation || intent === 'unknown' || toolCalled === 'save_preference' || toolCalled === 'add_automation_rule') {
    flow.push('Strategy Agent');
  }

  const daoTools = [
    'deposit',
    'withdraw_phase1',
    'withdraw_phase2',
    'schedule_harvest',
    'list_dao_cells',
    'calculate_rewards',
    'get_epoch_info',
    'explain_dao'
  ];
  
  const walletTools = [
    'send_ckb',
    'get_balance'
  ];

  if (toolCalled) {
    if (daoTools.includes(toolCalled)) {
      flow.push('DAO Agent');
    } else if (walletTools.includes(toolCalled)) {
      flow.push('Wallet Agent');
    }
  } else {
    // Fallback based on text processing intent
    if (intent.includes('withdraw') || intent.includes('deposit') || intent.includes('dao') || intent.includes('harvest')) {
      flow.push('DAO Agent');
    } else if (intent.includes('balance') || intent === 'send') {
      flow.push('Wallet Agent');
    }
  }

  // Ensure unique, though ordering is preserved (Strategy usually first if it exists acting as the orchestrator)
  return [...new Set(flow)];
}
