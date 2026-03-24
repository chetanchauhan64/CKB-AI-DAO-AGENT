import { logger } from '../utils/logger';

export const GlobalMemoryStore = {
  preferences: new Map<string, string>(),
  automationRules: new Set<string>(),

  savePreference: (key: string, value: string) => {
    GlobalMemoryStore.preferences.set(key, value);
    logger.info({ key, value }, 'Agent preference saved');
  },

  addRule: (rule: string) => {
    GlobalMemoryStore.automationRules.add(rule);
    logger.info({ rule }, 'Agent automation rule saved');
  },

  getPromptContext: (): string => {
    let ctx = '';

    if (GlobalMemoryStore.preferences.size > 0) {
      ctx += '\\nActive User Preferences/Memory:\\n';
      for (const [k, v] of GlobalMemoryStore.preferences.entries()) {
        ctx += `- ${k}: ${v}\\n`;
      }
    }

    if (GlobalMemoryStore.automationRules.size > 0) {
      ctx += '\\nActive Natural Language Automation Rules (Read-Only):\\n';
      for (const rule of GlobalMemoryStore.automationRules) {
        ctx += `- "${rule}"\\n`;
      }
    }

    return ctx;
  },
};
