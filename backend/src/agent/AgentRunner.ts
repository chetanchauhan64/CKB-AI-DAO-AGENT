import { AGENT_TOOLS } from './ToolRegistry';
import { AgentMemory } from './AgentMemory';
import { parseIntent } from './IntentParser';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { AgentRunResult } from '../../../shared/types/agent';
import { executeTool } from './tools/index';
import { getStrategySummary } from './strategyEngine';
import { getAgentFlow } from './agentManager';
import { aiClient } from '../utils/aiClient';
import { GlobalMemoryStore } from './MemoryStore';

const getSystemPrompt = (): string => `You are DAO Yield Agent, an autonomous AI assistant managing a CKB (CKByte) wallet and Nervos DAO deposits on the CKB Testnet.

Your capabilities:
- Deposit CKB into Nervos DAO
- Initiate Phase 1 withdrawals (transforms deposit → withdrawing cell)
- Complete Phase 2 unlocks and claim rewards (after 180-epoch lock)
- Check wallet balance and list DAO cells
- Calculate estimated rewards
- Enable/disable automatic yield harvesting
- Explain the Nervos DAO mechanism
- Save and recall User Preferences (Alias names, behaviors)
- Parse and save Natural Language Automation Rules (Read-only reference)

Guidelines:
1. Always confirm amounts and actions before executing them
2. If a user asks to deposit, ALWAYS call the deposit tool (don't just describe the action)
3. For withdrawals, always clarify which phase (1 or 2) unless the user specifies
4. Be concise but informative — include tx hashes and CKB amounts in responses
5. If you encounter an error, explain it clearly and suggest remediation
6. CKB Testnet is being used — all transactions are for testing purposes
7. If the user mentions a name like "Cold Wallet" or tells you a rule, use save_preference or add_automation_rule to memorize it.
8. **CRITICAL:** Whenever you take a tangible action (like depositing, sending, applying a recommendation), you MUST format an explanation block at the very end of your final response like this:
<explanation>
{
  "decision": "Brief summary of decision",
  "reason": "Why this action makes sense",
  "action": "What was executed/recommended",
  "outcome": "Expected outcome"
}
</explanation>

Network: CKB Testnet (https://testnet.ckb.dev)
Current date: ${new Date().toISOString().split('T')[0]}

${GlobalMemoryStore.getPromptContext()}
`;

export class AgentRunner {
  private readonly memory: AgentMemory;
  private onEvent?: (event: { type: string; data: unknown }) => void;

  constructor(sessionId: string, onEvent?: (event: { type: string; data: unknown }) => void) {
    this.memory = new AgentMemory(sessionId);
    this.onEvent = onEvent;
  }

  private emit(type: string, data: unknown) {
    this.onEvent?.({ type, data });
  }

  /**
   * Run the agent: NL message → intent parse → OpenAI OpenRouter → tool execution → response
   */
  async run(userMessage: string): Promise<AgentRunResult> {
    logger.info({ userMessage }, 'Agent run started');

    // 1. Fast intent classification (pre-LLM)
    const intent = parseIntent(userMessage);
    logger.debug({ intent }, 'Intent parsed');

    // 2. Add user message to historical memory
    this.memory.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    this.emit('AGENT_THINKING', { message: 'Interpreting natural language intent...' });

    // 3. Build OpenAI message execution context
    // We inject the system prompt natively and pull conversation history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openAIMessages: any[] = [
      { role: 'system', content: getSystemPrompt() },
      ...this.memory.toOpenAIMessages()
    ];

    let finalResponse = '';
    let toolCalled: string | undefined;
    let toolInput: Record<string, unknown> | undefined;
    let toolResult: unknown;
    let txHash: string | undefined;

    // 4. Agentic loop (LLM may call sequential tools before returning)
    const MAX_ITERATIONS = 5;
    let iterCount = 0;

    while (iterCount < MAX_ITERATIONS) {
      iterCount++;

      const response = await aiClient.chat.completions.create({
        model: env.openRouterModel,
        messages: openAIMessages,
        tools: AGENT_TOOLS,
        temperature: 0.2, // standard deterministic temp for financial agents
      });

      const message = response.choices[0].message;

      if (message.tool_calls && message.tool_calls.length > 0) {
        // Append assistant's tool invocation so follow-up sequence maintains state
        openAIMessages.push(message);

        const toolCall = message.tool_calls[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toolCalled = (toolCall as any).function.name;
        
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          toolInput = JSON.parse((toolCall as any).function.arguments);
        } catch (e) {
          toolInput = {};
        }

        if (!toolCalled) continue;

        logger.info({ tool: toolCalled, input: toolInput }, 'Agent calling tool via OpenRouter');
        this.emit('AGENT_TOOL_CALL', { tool: toolCalled, input: toolInput });
        this.emit('AGENT_THINKING', { message: `Mapping intent to Tool: ${toolCalled}...` });

        // Execute the tool locally
        let toolResultContent: string;
        let isError = false;

        try {
          const result = await executeTool(toolCalled, toolInput || {});
          toolResult = result;
          toolResultContent = JSON.stringify(result, null, 2);

          // Extract txHash if present
          if (result && typeof result === 'object' && 'txHash' in result) {
            txHash = (result as { txHash: string }).txHash;
          }
        } catch (err: unknown) {
          isError = true;
          const msg = err instanceof Error ? err.message : String(err);
          toolResultContent = `Error: ${msg}`;
          logger.error({ tool: toolCalled, error: msg }, 'Tool execution failed');
        }

        // Return tool output to OpenAI
        openAIMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResultContent,
        });

        this.emit(
          isError ? 'TOOL_ERROR' : 'TOOL_SUCCESS',
          { tool: toolCalled, result: toolResultContent },
        );
        continue;
      }

      // 5. No more tools returned, execution turn complete — STREAM the final response
      const streamResponse = await aiClient.chat.completions.create({
        model: env.openRouterModel,
        messages: openAIMessages,
        temperature: 0.2,
        stream: true,
      });

      let inExplanationBlock = false;

      for await (const chunk of streamResponse) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (!delta) continue;

        finalResponse += delta;

        // Strip streaming if the AI started writing its explanation block
        if (!inExplanationBlock && finalResponse.includes('<explanation>')) {
          inExplanationBlock = true;
        }

        if (!inExplanationBlock) {
          this.emit('AGENT_MESSAGE_CHUNK', { chunk: delta });
        }
      }
      
      this.memory.addMessage({
        role: 'assistant',
        content: finalResponse,
        timestamp: Date.now(),
      });
      break;
    }

    // 6. Extract Explanation Block Data if appended
    let explanation;
    const explanationRegex = /<explanation>([\s\S]*?)<\/explanation>/;
    const match = finalResponse.match(explanationRegex);
    if (match) {
      try {
        explanation = JSON.parse(match[1]);
        finalResponse = finalResponse.replace(explanationRegex, '').trim();
      } catch (e) {
        logger.error({ e, raw: match[1] }, 'Failed to parse explanation JSON');
      }
    }

    this.emit('AGENT_THINKING', { message: 'Analyzing portfolio for strategic insights...' });
    const strategy = await getStrategySummary() || undefined;

    const agentFlow = getAgentFlow(intent.intent, toolCalled, !!strategy, !!explanation);

    return {
      response: finalResponse,
      toolCalled,
      toolInput,
      toolResult,
      txHash,
      intent: intent.intent,
      tokensUsed: undefined,
      strategy,
      explanation,
      agentFlow,
    };
  }
}
