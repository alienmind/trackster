/**
 * AWS Bedrock provider (Converse API).
 *
 * Uses the AWS SDK v3 `BedrockRuntimeClient.converse()` method to call
 * models via a VPC endpoint. Authentication goes through STS AssumeRole
 * when `LLM_BEDROCK_ROLE_ARN` is set, otherwise the default AWS credential
 * chain is used (useful for local development with AWS profiles).
 *
 * Guardrails are mandatory per the organisation's SCP - calls without a
 * guardrail config will be denied at the API level.
 */
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConversationRole,
  type ContentBlock,
  type SystemContentBlock,
  type Message,
} from '@aws-sdk/client-bedrock-runtime';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromEnv } from '@aws-sdk/credential-provider-env';
import { fromInstanceMetadata } from '@smithy/credential-provider-imds';
import type { AwsCredentialIdentityProvider } from '@smithy/types';
import {
  isPlaceholder,
  readTemperature,
  readTimeoutMs,
  DEFAULT_MAX_TOKENS,
  type ChatMessage,
  type ChatOptions,
} from './util';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type BedrockEnv = {
  region: string;
  roleArn?: string;
  endpointUrl: string;
  modelId: string;
  guardrailId: string;
  guardrailVersion: string;
  temperature: number;
};

export const readBedrockEnv = (): BedrockEnv | null => {
  const endpointUrl = process.env.LLM_BEDROCK_ENDPOINT_URL;
  const modelId = process.env.LLM_BEDROCK_MODEL_ID;
  const guardrailId = process.env.LLM_BEDROCK_GUARDRAIL_ID;
  const guardrailVersion = process.env.LLM_BEDROCK_GUARDRAIL_VERSION;

  if (
    isPlaceholder(endpointUrl) ||
    isPlaceholder(modelId) ||
    isPlaceholder(guardrailId) ||
    isPlaceholder(guardrailVersion)
  ) {
    return null;
  }

  const region = process.env.LLM_BEDROCK_REGION ?? 'eu-central-1';
  const roleArn = isPlaceholder(process.env.LLM_BEDROCK_ROLE_ARN)
    ? undefined
    : process.env.LLM_BEDROCK_ROLE_ARN;
  const temperature = readTemperature();

  console.info('[llm-client/bedrock] configured', {
    region,
    endpointUrl,
    modelId,
    guardrailId,
    guardrailVersion,
    roleArn: roleArn ? '***' : '(default credential chain)',
    temperature,
  });

  return {
    region,
    roleArn,
    endpointUrl: endpointUrl!,
    modelId: modelId!,
    guardrailId: guardrailId!,
    guardrailVersion: guardrailVersion!,
    temperature,
  };
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const buildClient = async (env: BedrockEnv): Promise<BedrockRuntimeClient> => {
  if (env.roleArn) {
    const sts = new STSClient({ region: env.region });
    const assumed = await sts.send(
      new AssumeRoleCommand({
        RoleArn: env.roleArn,
        RoleSessionName: 'ssm-ng-llm-client',
      })
    );
    const creds = assumed.Credentials;
    if (!creds?.AccessKeyId || !creds.SecretAccessKey || !creds.SessionToken) {
      throw new Error('[llm-client/bedrock] STS AssumeRole returned incomplete credentials');
    }
    return new BedrockRuntimeClient({
      region: env.region,
      endpoint: env.endpointUrl,
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
      },
    });
  }

  // Build an explicit credential chain: environment vars, then IMDS.
  // The default AWS SDK credential chain uses dynamic `await import()` calls
  // that are incompatible with jiti's module resolution.
  const credentials: AwsCredentialIdentityProvider = async () => {
    try {
      return await fromEnv()();
    } catch {
      return fromInstanceMetadata()();
    }
  };
  return new BedrockRuntimeClient({
    region: env.region,
    endpoint: env.endpointUrl,
    credentials,
  });
};

/**
 * Convert the flat ChatMessage[] array into the Bedrock Converse format:
 * - System messages are extracted into a separate `system` array.
 * - User/assistant messages become `Message` objects with content blocks.
 */
const convertMessages = (
  messages: ChatMessage[]
): { system: SystemContentBlock[]; converseMessages: Message[] } => {
  const system: SystemContentBlock[] = [];
  const converseMessages: Message[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system.push({ text: msg.content });
    } else {
      converseMessages.push({
        role: msg.role as ConversationRole,
        content: [{ text: msg.content } as ContentBlock],
      });
    }
  }

  return { system, converseMessages };
};

// ---------------------------------------------------------------------------
// Public call surface
// ---------------------------------------------------------------------------

export const callBedrock = async (
  env: BedrockEnv,
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<{ content: string; model: string }> => {
  const temperature = opts.temperature ?? env.temperature;
  const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
  const modelId = opts.model ?? env.modelId;
  const started = Date.now();

  console.info('[llm-client/bedrock] -> converse', {
    modelId,
    messageCount: messages.length,
    temperature,
    maxTokens,
  });

  if (opts.jsonResponse) {
    console.warn(
      '[llm-client/bedrock] jsonResponse option is not supported by Bedrock Converse API, ignoring'
    );
  }

  const client = await buildClient(env);
  const { system, converseMessages } = convertMessages(messages);

  const timeoutMs = readTimeoutMs(opts.timeoutMs);
  const abortController = new AbortController();
  const timeout =
    timeoutMs > 0
      ? setTimeout(() => abortController.abort(), timeoutMs)
      : null;

  try {
    const command = new ConverseCommand({
      modelId,
      messages: converseMessages,
      system: system.length > 0 ? system : undefined,
      inferenceConfig: {
        maxTokens,
        temperature,
      },
      guardrailConfig: {
        guardrailIdentifier: env.guardrailId,
        guardrailVersion: env.guardrailVersion,
        trace: 'enabled',
      },
    });

    const response = await client.send(command, {
      abortSignal: abortController.signal,
    });

    const content = response.output?.message?.content?.[0]?.text;
    if (!content) {
      console.error('[llm-client/bedrock] response missing content', response.output);
      throw new Error('Bedrock response did not include output.message.content[0].text.');
    }

    const usage = response.usage;
    console.info('[llm-client/bedrock] <- converse OK', {
      durationMs: Date.now() - started,
      contentChars: content.length,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });

    return { content, model: modelId };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    console.error(`[llm-client/bedrock] converse ${isAbort ? 'timed out' : 'errored'}`, {
      durationMs: Date.now() - started,
      timeoutMs,
      error: err instanceof Error ? err.message : String(err),
    });
    if (isAbort) {
      throw new Error(`Bedrock call timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};
