/** Shared helpers and types for LLM provider submodules. */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type Provider = 'openai' | 'github-models' | 'bedrock';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatOptions = {
  /** Override LLM_TEMPERATURE / env temperature for this call. */
  temperature?: number;
  /** When true, ask the server for `response_format: json_object`. */
  jsonResponse?: boolean;
  /** Override the configured model for this call. */
  model?: string;
  /**
   * Maximum number of tokens the model should generate. Defaults to 4096.
   * Passed as `max_tokens` to OpenAI-compatible providers and as
   * `inferenceConfig.maxTokens` to Bedrock Converse.
   */
  maxTokens?: number;
  /**
   * Abort the request after this many milliseconds. Defaults to
   * `LLM_TIMEOUT_MS` (env) or 60_000ms. Set to 0 to disable.
   */
  timeoutMs?: number;
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export const isPlaceholder = (v: string | undefined): boolean =>
  !v || (v.startsWith('<') && v.endsWith('>'));

/**
 * Read the global `LLM_TEMPERATURE` env var and return a finite number,
 * defaulting to 0.1 when the value is missing or unparseable.
 */
export const readTemperature = (): number => {
  const raw = process.env.LLM_TEMPERATURE;
  if (!raw) return 0.1;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0.1;
};

/** Read `LLM_TIMEOUT_MS` from env, falling back to 60 000 ms. */
export const readTimeoutMs = (override?: number): number => {
  if (override !== undefined) return override;
  const envTimeout = process.env.LLM_TIMEOUT_MS ? Number(process.env.LLM_TIMEOUT_MS) : NaN;
  return Number.isFinite(envTimeout) && envTimeout >= 0 ? envTimeout : 60_000;
};

export const DEFAULT_MAX_TOKENS = 4096;
