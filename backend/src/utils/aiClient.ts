import OpenAI from 'openai';
import { env } from '../config/env';

export const aiClient = new OpenAI({
  apiKey: env.openRouterApiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/magickbase/ckb-dao-yield-agent',
    'X-Title': 'CKB DAO Yield Agent',
  }
});
