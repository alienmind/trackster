/**
 * OpenAI-compatible provider.
 *
 * Works with any endpoint that speaks the `/chat/completions` shape:
 * OpenAI, OpenRouter, a local vLLM/llama.cpp server, etc.
 * Plain bearer API key - no OAuth / U2A flow.
 */
import { isPlaceholder, readTemperature } from './util';

export type OpenAiEnv = {
  url: string;
  apiKey: string;
  model: string;
  temperature: number;
};

export type ReadOpenAiOptions = {
  /** Default model when `LLM_OPENAI_API_MODEL` is unset. Defaults to `gpt-4o`. */
  defaultModel?: string;
};

export const readOpenAiEnv = (opts: ReadOpenAiOptions = {}): OpenAiEnv | null => {
  const apiKey = process.env.LLM_OPENAI_API_KEY;
  const rawUrl = process.env.LLM_OPENAI_API_URL;
  if (isPlaceholder(apiKey) || isPlaceholder(rawUrl)) return null;

  const url = rawUrl!.replace(/\/+$/, '');
  const model = process.env.LLM_OPENAI_API_MODEL ?? opts.defaultModel ?? 'gpt-4o';
  const temperature = readTemperature();

  console.info('[llm-client/openai] configured', { url, model, temperature });

  return { url, apiKey: apiKey!, model, temperature };
};
