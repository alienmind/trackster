/**
 * GitHub Models provider.
 *
 * Uses GitHub's free hosted inference endpoint (OpenAI-compatible) with a
 * GitHub personal access token that has the `models:read` permission.
 *
 * Token resolution order:
 *   1. `LLM_GITHUB_MODELS_TOKEN` env var
 *   2. `GITHUB_TOKEN` env var
 *   3. `gh auth token` CLI fallback
 */
import { execFileSync } from 'node:child_process';
import { isPlaceholder, readTemperature } from './util';

export type GithubModelsEnv = {
  token: string;
  url: string;
  model: string;
  temperature: number;
  tokenSource: 'LLM_GITHUB_MODELS_TOKEN' | 'GITHUB_TOKEN' | 'gh auth token';
};

export type ReadGithubModelsOptions = {
  /** Default model when `LLM_GITHUB_MODELS_MODEL` is unset. Defaults to `gpt-4o`. */
  defaultModel?: string;
};

const tryGhCliToken = (): string | undefined => {
  try {
    const out = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const token = out.trim();
    return token.length > 0 ? token : undefined;
  } catch {
    return undefined;
  }
};

export const readGithubModelsEnv = (
  opts: ReadGithubModelsOptions = {}
): GithubModelsEnv | null => {
  let token: string | undefined;
  let tokenSource: GithubModelsEnv['tokenSource'];
  if (!isPlaceholder(process.env.LLM_GITHUB_MODELS_TOKEN)) {
    token = process.env.LLM_GITHUB_MODELS_TOKEN;
    tokenSource = 'LLM_GITHUB_MODELS_TOKEN';
  } else if (!isPlaceholder(process.env.GITHUB_TOKEN)) {
    token = process.env.GITHUB_TOKEN;
    tokenSource = 'GITHUB_TOKEN';
  } else {
    const cli = tryGhCliToken();
    if (cli) {
      token = cli;
      tokenSource = 'gh auth token';
    } else {
      return null;
    }
  }

  const url = (process.env.LLM_GITHUB_MODELS_URL ?? 'https://models.github.ai/inference').replace(
    /\/+$/,
    ''
  );
  const model = process.env.LLM_GITHUB_MODELS_MODEL ?? opts.defaultModel ?? 'gpt-4o';
  const temperature = readTemperature();

  console.info('[llm-client/github-models] configured', {
    url,
    model,
    temperature,
    tokenSource,
  });

  return { token: token!, url, model, temperature, tokenSource };
};
