import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { type Messages } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';
import { convertToCoreMessages, createDataStream, streamText, type DataStreamWriter } from 'ai';
import type { ContextAnnotation, ProgressAnnotation } from '~/types/context';
import { createSummary } from '~/lib/.server/llm/create-summary';
import { WORK_DIR } from '~/utils/constants';
import { anthropic } from '@ai-sdk/anthropic';
import { getSystemPrompt } from '~/lib/common/prompts/prompts';

const logger = createScopedLogger('api.chat2');

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

type RequestProgress = {
  counter: number,
  cumulativeUsage: { completionTokens: number, promptTokens: number, totalTokens: number },
}

async function chatAction({ request }: ActionFunctionArgs) {
  const { messages } = await request.json<{ messages: Messages }>()
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

        const systemPrompt = getSystemPrompt(WORK_DIR);
        const userMessages = buildUserMessages(messages);
        const result = streamText({
          model: anthropic("claude-3-5-sonnet-20241022"),
          system: systemPrompt,
          maxTokens: 8192,
          messages: userMessages,
          toolChoice: 'none',
          onFinish: async ({ usage }) => {
            logger.debug('usage', JSON.stringify(usage));
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
          }
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
    return new Response(dataStream, {
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
  let processedMessages = messages.map((message) => {
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