import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gcloudValue } from './structured.ts';

export async function configureVertexEnvironment(): Promise<void> {
  const envPath = fileURLToPath(new URL('../../.env.local', import.meta.url));
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    try {
      const project = await gcloudValue(['config', 'get-value', 'project', '--quiet']);
      if (project && project !== '(unset)') process.env.GOOGLE_CLOUD_PROJECT = project;
    } catch {
      /* Report missing configuration, never substitute cached evidence. */
    }
  }
}
