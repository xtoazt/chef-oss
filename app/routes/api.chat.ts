import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import type { Messages } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';
import { convertToCoreMessages, createDataStream, streamText } from 'ai';
import type { ProgressAnnotation } from '~/types/context';
import { WORK_DIR } from '~/utils/constants';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getSystemPrompt } from '~/lib/common/prompts/prompts';
import { createOpenAI } from '@ai-sdk/openai';

const logger = createScopedLogger('api.chat2');

export async function action(args: ActionFunctionArgs) {
  return chatAction(args, args.context.cloudflare.env);
}

type RequestProgress = {
  counter: number;
  cumulativeUsage: { completionTokens: number; promptTokens: number; totalTokens: number };
};

async function chatAction({ request }: ActionFunctionArgs, env: Env) {
  const provider = makeProvider(env);
  const { messages } = await request.json<{ messages: Messages }>();
  const progress: RequestProgress = {
    counter: 1,
    cumulativeUsage: {
      completionTokens: 0,
      promptTokens: 0,
      totalTokens: 0,
    },
  };

  try {
    const totalMessageContent = messages.reduce((acc, message) => acc + message.content, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);

    const dataStream = createDataStream({
      async execute(dataStream) {
        dataStream.writeData({
          type: 'progress',
          label: 'response',
          status: 'in-progress',
          order: progress.counter++,
          message: 'Generating Response',
        } satisfies ProgressAnnotation);

        let systemPrompt: string | undefined;
        if (provider.includeSystemPrompt) {
          systemPrompt = getSystemPrompt(WORK_DIR);
        }
        const userMessages = buildUserMessages(messages);
        const result = streamText({
          model: provider.model,
          system: systemPrompt,
          maxTokens: provider.maxTokens,
          messages: userMessages,
          toolChoice: 'none',
          onFinish: async (result) => {
            const { usage } = result;
            console.log("Finished streaming", {
              finishReason: result.finishReason,
              usage,
              providerMetadata: result.providerMetadata,
            });

            if (usage) {
              progress.cumulativeUsage.completionTokens += usage.completionTokens || 0;
              progress.cumulativeUsage.promptTokens += usage.promptTokens || 0;
              progress.cumulativeUsage.totalTokens += usage.totalTokens || 0;
            }

            dataStream.writeMessageAnnotation({
              type: 'usage',
              value: {
                completionTokens: progress.cumulativeUsage.completionTokens,
                promptTokens: progress.cumulativeUsage.promptTokens,
                totalTokens: progress.cumulativeUsage.totalTokens,
              },
            });
            dataStream.writeData({
              type: 'progress',
              label: 'response',
              status: 'complete',
              order: progress.counter++,
              message: 'Response Generated',
            } satisfies ProgressAnnotation);
            await new Promise((resolve) => setTimeout(resolve, 0));
          },
        });
        const logErrors = async () => {
          for await (const part of result.fullStream) {
            if (part.type === 'error') {
              const error: any = part.error;
              logger.error(`${error}`);

              return;
            }
          }
        };
        void logErrors();
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error: any) => `Custom error: ${error.message}`,
    });

    // Cloudflare expects binary data in its streams.
    const encoder = new TextEncoder();
    const binaryStream = dataStream.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        const toSerialize = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
        const binary = encoder.encode(toSerialize);
        controller.enqueue(binary);
      },
    }));
    return new Response(binaryStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Text-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    logger.error(error);

    if (error.message?.includes('API key')) {
      throw new Response('Invalid or missing API key', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}

function buildUserMessages(messages: Messages) {
  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      return message;
    } else if (message.role == 'assistant') {
      let content = message.content;
      content = content.replace(/<div class=\\"__boltThought__\\">.*?<\/div>/s, '');
      content = content.replace(/<think>.*?<\/think>/s, '');

      return { ...message, content };
    }

    return message;
  });
  return convertToCoreMessages(processedMessages);
}

// sujayakar, 2025-03-25: This is mega-hax, but I can't figure out
// how to get the AI SDK to pass the cache control header to
// Anthropic with the `streamText` function. Setting
// `providerOptions.anthropic.cacheControl` doesn't seem to do
// anything. So, we instead directly inject the cache control
// header into the body of the request.
function anthropicInjectCacheControl(options?: RequestInit) {
  const start = Date.now();
  if (!options) {
    return options;
  }
  if (options.method !== "POST") {
    return options;
  }
  const headers = options.headers;
  if (!headers) {
    return options;
  }
  const contentType = new Headers(headers).get("content-type");
  if (contentType !== "application/json") {
    return options;
  }
  if (typeof options.body !== "string") {
    throw new Error("Body must be a string");
  }
  const startChars = options.body.length;
  const body = JSON.parse(options.body);
  body.system = [
    {
      type: "text",
      text: getSystemPrompt(WORK_DIR),
      cache_control: { type: "ephemeral" },
    },
    // NB: The client dynamically manages files injected as context
    // past this point, and we don't want them to pollute the cache.
    ...(body.system ?? []),
  ];
  const newBody = JSON.stringify(body);
  console.log(
    `Injected system messages in ${Date.now() - start}ms (${startChars} -> ${
      newBody.length
    } chars)`
  );
  return { ...options, body: newBody };
}

function makeProvider(env: Env) {
  const anthropic = createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    fetch: async (url, options) => {
      return fetch(url, anthropicInjectCacheControl(options));
    },
  });
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  const providers = {
    anthropic: {
      maxTokens: 8192,
      model: anthropic("claude-3-5-sonnet-20241022"),
      includeSystemPrompt: false,
    },
    openai: {
      maxTokens: 16384,
      model: openai("gpt-4o-2024-11-20"),
      includeSystemPrompt: true,
    }
  }
  return providers.anthropic;
}
