const approved = new Set([
  'Transport unavailable or request timed out.',
  'Response was not valid JSON.',
  'Google Cloud CLI authentication or configuration is unavailable.',
  'GOOGLE_CLOUD_PROJECT is required for Vertex live evaluations.',
  'Invalid Vertex project, location, or model configuration.',
  'Vertex credentials are unavailable. Configure ADC or sign in to gcloud.',
  'Vertex response has no single completed candidate.',
  'Vertex response was blocked or did not complete.',
  'Vertex response text is missing.',
  'Vertex response was not valid JSON.',
  'Live mode requires HTTP Guard evidence, not cached checks.',
  'Live OpenAI mode requires OPENAI_API_KEY and OPENAI_MODEL.',
  'Evaluation mode must be demo or live.',
  'runs must be an integer from 1 to 10',
  'Guard decision invalid.',
  'Guard failed closed without policy evidence.',
  'Guard returned unverified or incompatible evidence.',
  'Engine contract version mismatch.',
  'Extraction answer must be an object.',
  'Summary answer is empty or invalid.',
]);

/** Untrusted adapter diagnostics must not place tokens or provider bodies in artifacts. */
export function safeDiagnostic(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return approved.has(message) || /^HTTP \d{3}\.$/.test(message)
    ? message
    : 'Evaluation adapter failed; raw diagnostics were omitted.';
}
