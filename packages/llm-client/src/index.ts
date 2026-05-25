/**
 * Reusable LLM client for SSM-NG services and apps.
 *
 * Three providers are supported:
 *
 *   1. `openai`         - any OpenAI-compatible endpoint reachable with a
 *                         simple bearer API key (OpenAI, OpenRouter, a local
 *                         vLLM/llama.cpp server, ...). No U2A / OAuth flow.
 *   2. `github-models`  - GitHub's free hosted inference endpoint, using a
 *                         GitHub personal access token with the `models:read`
 *                         permission.
 *   3. `bedrock`        - AWS Bedrock Converse API via a VPC endpoint, with
 *                         optional STS AssumeRole and mandatory guardrails.
 *
 * Provider auto-selection order: `openai` > `github-models` > `bedrock`.
 * Set `LLM_PROVIDER` (or pass `provider` explicitly) to force one.
 *
 * Callers wanting a "no-credentials available" fallback (e.g. a local mock
 * response) should check the return of `pickProvider()` for `null`.
 *
 * @example
 * ```ts
 * import { chat, pickProvider } from 'llm-client';
 * 
 * // 1. (Optional) Check if a provider is configured before calling
 * const providerInfo = pickProvider();
 * if (!providerInfo) {
 *   console.log('No LLM provider configured, using fallback mock.');
 *   // Provide fallback behavior...
 * }
 * 
 * // 2. Call the chat completion API
 * const result = await chat([
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'Hello!' }
 * ], {
 *   // Optional overrides
 *   temperature: 0.7,
 *   maxTokens: 1000,
 *   jsonResponse: false
 * });
 * 
 * console.log(`Response from ${result.provider} (model: ${result.model}):`);
 * console.log(result.content);
 * ```
 */

// Re-export types from submodules so consumers keep importing from the root.
export type { OpenAiEnv, ReadOpenAiOptions } from './openai';
export type { GithubModelsEnv, ReadGithubModelsOptions } from './github-models';
export type { BedrockEnv } from './bedrock';
export type { Provider, ChatMessage, ChatOptions } from './util';

import { readOpenAiEnv, type OpenAiEnv, type ReadOpenAiOptions } from './openai';
import { readGithubModelsEnv, type GithubModelsEnv, type ReadGithubModelsOptions } from './github-models';
import { readBedrockEnv, callBedrock, type BedrockEnv } from './bedrock';
import { type Provider, type ChatMessage, type ChatOptions, readTimeoutMs, DEFAULT_MAX_TOKENS } from './util';

// Re-export reader functions for direct use.
export { readOpenAiEnv, readGithubModelsEnv, readBedrockEnv };

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

type Resolved = {
  provider: Provider;
  url: string;
  apiKey: string;
  model: string;
  temperature: number;
  logTag: string;
};

/**
 * Pick which provider to use for the next call.
 *
 * - `LLM_PROVIDER=mock` -> returns `null` (caller is expected to use a local
 *   mock fallback).
 * - `LLM_PROVIDER=openai|github-models|bedrock` -> forces that provider.
 * - Otherwise auto-select the first provider with usable credentials, in
 *   this order: `openai` > `github-models` > `bedrock`.
 * - Returns `null` if no provider is configured.
 */
export const pickProvider = (
  opts: ReadOpenAiOptions & ReadGithubModelsOptions = {}
): {
  provider: Provider;
  openai: OpenAiEnv | null;
  githubModels: GithubModelsEnv | null;
  bedrock: BedrockEnv | null;
} | null => {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === 'mock') {
    return null;
  }

  const openai = readOpenAiEnv(opts);
  const githubModels = readGithubModelsEnv(opts);
  const bedrock = readBedrockEnv();

  if (explicit === 'openai' || explicit === 'github-models' || explicit === 'bedrock') {
    return { provider: explicit, openai, githubModels, bedrock };
  }
  if (explicit) {
    console.warn(
      `[llm-client] Unknown LLM_PROVIDER=${explicit}; falling back to auto-selection.`
    );
  }

  if (openai) return { provider: 'openai', openai, githubModels, bedrock };
  if (githubModels) return { provider: 'github-models', openai, githubModels, bedrock };
  if (bedrock) return { provider: 'bedrock', openai, githubModels, bedrock };
  return null;
};

// ---------------------------------------------------------------------------
// OpenAI-compatible call helpers
// ---------------------------------------------------------------------------

const resolveOpenAiLike = (
  provider: Provider,
  openai: OpenAiEnv | null,
  githubModels: GithubModelsEnv | null
): Resolved => {
  if (provider === 'openai') {
    if (!openai) {
      throw new Error(
        'LLM_PROVIDER=openai but OPENAI_API_KEY / OPENAI_API_URL are missing or placeholders.'
      );
    }
    return {
      provider,
      url: openai.url,
      apiKey: openai.apiKey,
      model: openai.model,
      temperature: openai.temperature,
      logTag: 'llm-client/openai',
    };
  }
  if (!githubModels) {
    throw new Error(
      'LLM_PROVIDER=github-models but no GitHub token found (set GITHUB_MODELS_TOKEN, GITHUB_TOKEN, or run `gh auth login`). The token must have the `models:read` permission.'
    );
  }
  return {
    provider,
    url: githubModels.url,
    apiKey: githubModels.token,
    model: githubModels.model,
    temperature: githubModels.temperature,
    logTag: 'llm-client/github-models',
  };
};

const callOpenAiLike = async (
  resolved: Resolved,
  messages: ChatMessage[],
  options: ChatOptions
): Promise<{ content: string; provider: Provider; model: string }> => {
  const model = options.model ?? resolved.model;
  const temperature = options.temperature ?? resolved.temperature;
  const url = `${resolved.url}/chat/completions`;
  const started = Date.now();
  console.info(`[${resolved.logTag}] -> chat/completions`, {
    url,
    model,
    temperature,
    messages: messages.length,
  });

  const body: Record<string, unknown> = {
    model,
    temperature,
    messages,
  };
  if (options.jsonResponse) {
    body.response_format = { type: 'json_object' };
  }
  if (options.maxTokens !== undefined) {
    body.max_tokens = options.maxTokens;
  }

  const timeoutMs = readTimeoutMs(options.timeoutMs);
  const signal = timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolved.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === 'TimeoutError';
    console.error(`[${resolved.logTag}] chat/completions ${isAbort ? 'timed out' : 'errored'}`, {
      durationMs: Date.now() - started,
      timeoutMs,
      error: err instanceof Error ? err.message : String(err),
    });
    if (isAbort) {
      throw new Error(`${resolved.provider} call timed out after ${timeoutMs}ms`);
    }
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(`[${resolved.logTag}] chat/completions failed`, {
      status: res.status,
      durationMs: Date.now() - started,
      body: text,
    });
    throw new Error(
      `${resolved.provider} call failed with status ${res.status}: ${text}`
    );
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`[${resolved.logTag}] response missing content`, payload);
    throw new Error(`${resolved.provider} response did not include choices[0].message.content.`);
  }
  console.info(`[${resolved.logTag}] <- chat/completions OK`, {
    durationMs: Date.now() - started,
    contentChars: content.length,
  });
  return { content, provider: resolved.provider, model };
};

// ---------------------------------------------------------------------------
// Unified entry point
// ---------------------------------------------------------------------------

/**
 * Execute a chat-completion call against the auto-selected (or explicitly
 * specified) provider. Returns the raw assistant content string, the resolved
 * provider name, and the model used.
 *
 * Throws if no provider is configured. Callers wanting a graceful "no
 * credentials" path should call `pickProvider()` first.
 */
export const chat = async (
  messages: ChatMessage[],
  options: ChatOptions & { provider?: Provider } = {}
): Promise<{ content: string; provider: Provider; model: string }> => {
  const picked = pickProvider();
  const provider = options.provider ?? picked?.provider;
  if (!provider) {
    throw new Error(
      'No LLM provider configured. Set LLM_OPENAI_API_KEY (+LLM_OPENAI_API_URL), a GitHub Models token, or LLM_BEDROCK_* variables.'
    );
  }

  // --- Bedrock path (AWS SDK, not OpenAI-compatible) ---
  if (provider === 'bedrock') {
    const bedrock = picked?.bedrock ?? readBedrockEnv();
    if (!bedrock) {
      throw new Error(
        'LLM_PROVIDER=bedrock but required LLM_BEDROCK_* env vars (ENDPOINT_URL, MODEL_ID, GUARDRAIL_ID, GUARDRAIL_VERSION) are missing or placeholders.'
      );
    }
    const result = await callBedrock(bedrock, messages, options);
    return { ...result, provider: 'bedrock' };
  }

  // --- OpenAI-compatible path (openai, github-models) ---
  const resolved = resolveOpenAiLike(
    provider,
    picked?.openai ?? readOpenAiEnv(),
    picked?.githubModels ?? readGithubModelsEnv()
  );

  return callOpenAiLike(resolved, messages, options);
};
