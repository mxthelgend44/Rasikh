import { AiError } from './errors';

export type AiEnv = Record<string, string | undefined>;
export interface VertexConfig {
  project: string;
  location: string;
  model: string;
  env: AiEnv;
}

/** Credentials are read only in the server route graph, never returned to clients. */
export function readConfig(env: AiEnv = process.env): VertexConfig {
  if (typeof window !== 'undefined') throw new Error('AI configuration is server-only.');
  if (env.RASIKH_AI_ENABLED !== '1') {
    throw new AiError('ai_unavailable', 'Live AI is not enabled for this deployment.');
  }
  const project = env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT;
  const location = env.GOOGLE_CLOUD_LOCATION ?? 'global';
  const model = env.VERTEX_MODEL ?? 'gemini-3.8-flash';
  if (
    !project ||
    !/^[a-z0-9][a-z0-9.:-]{0,127}$/i.test(project) ||
    !/^[a-z0-9-]{1,40}$/.test(location) ||
    !/^gemini-[a-z0-9._-]{1,80}$/.test(model) ||
    (!env.VERTEX_ACCESS_TOKEN &&
      !env.VERTEX_SERVICE_ACCOUNT_JSON &&
      env.RASIKH_VERTEX_METADATA_AUTH !== '1')
  ) {
    throw new AiError('ai_unavailable', 'The live AI provider is not configured.');
  }
  return { project, location, model, env };
}
