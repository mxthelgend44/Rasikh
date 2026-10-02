import type { AiMode } from './types';

export interface RuntimeConfig {
  mode: AiMode;
  guardUrl: string;
  openaiApiKey: string | undefined;
  openaiModel: string | undefined;
}

/** Server-side only. Credentials are read from the environment and never returned to callers. */
export function readConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig {
  return {
    mode: env.RASIKH_AI_MODE === 'live' ? 'live' : 'demo',
    guardUrl: env.RASIKH_GUARD_URL || 'http://localhost:8787',
    openaiApiKey: env.OPENAI_API_KEY || undefined,
    openaiModel: env.OPENAI_MODEL || undefined,
  };
}
