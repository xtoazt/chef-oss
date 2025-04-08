import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import { convexAgent, getEnv } from '~/lib/.server/llm/convex-agent';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import type { Message } from 'ai';

type Messages = Message[];

const logger = createScopedLogger('api.chat');

export async function action(args: ActionFunctionArgs) {
  return chatAction(args, args.context.cloudflare.env);
}

export type Tracer = ReturnType<typeof WebTracerProvider.prototype.getTracer>;

async function chatAction({ request }: ActionFunctionArgs, env: Env) {
  const AXIOM_API_TOKEN = getEnv(env, 'AXIOM_API_TOKEN');
  const AXIOM_API_URL = getEnv(env, 'AXIOM_API_URL');
  const AXIOM_DATASET_NAME = getEnv(env, 'AXIOM_DATASET_NAME');
  const PROVISION_HOST = getEnv(env, 'PROVISION_HOST') || 'https://api.convex.dev';

  let tracer: Tracer | null = null;
  if (AXIOM_API_TOKEN && AXIOM_API_URL && AXIOM_DATASET_NAME) {
    const exporter = new OTLPTraceExporter({
      url: AXIOM_API_URL,
      headers: {
        Authorization: `Bearer ${AXIOM_API_TOKEN}`,
        'X-Axiom-Dataset': AXIOM_DATASET_NAME,
      },
    });
    const provider = new WebTracerProvider({
      spanProcessors: [
        new BatchSpanProcessor(exporter, {
          // The maximum queue size. After the size is reached spans are dropped.
          maxQueueSize: 100,
          // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
          maxExportBatchSize: 10,
          // The interval between two consecutive exports
          scheduledDelayMillis: 500,
          // How long the export can run before it is cancelled
          exportTimeoutMillis: 30000,
        }),
      ],
    });
    provider.register();
    tracer = provider.getTracer('ai');
    logger.info('✅ Axiom instrumentation registered!');
  } else {
    logger.warn('⚠️ AXIOM_API_TOKEN, AXIOM_API_URL, and AXIOM_DATASET_NAME not set, skipping Axiom instrumentation.');
  }

  const body = await request.json<{
    messages: Messages;
    firstUserMessage: boolean;
    chatId: string;
    deploymentName: string;
    token: string;
    teamSlug: string;
  }>();
  const { messages, firstUserMessage, chatId, deploymentName, token, teamSlug } = body;

  if (token) {
    const Authorization = `Bearer ${token}`;
    const url = `${PROVISION_HOST}/api/dashboard/teams/${teamSlug}/usage/get_token_info`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      logger.error(url);
      logger.error(response);
      logger.error(await response.json());
      return new Response(JSON.stringify({ error: 'Failed to check for tokens' }), {
        status: response.status,
      });
    }
    const { tokensUsed, tokensQuota }: { tokensUsed: number; tokensQuota: number } = await response.json();
    if (tokensUsed >= tokensQuota) {
      logger.error(`No tokens available for ${deploymentName}: ${tokensUsed} of ${tokensQuota}`);
      return new Response(JSON.stringify({ error: `No tokens available. Used ${tokensUsed} of ${tokensQuota}` }), {
        status: 402,
      });
    }
    logger.info(`Tokens used: ${tokensUsed}, quota: ${tokensQuota}`);
  }

  try {
    const totalMessageContent = messages.reduce((acc, message) => acc + message.content, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);
    const result = await convexAgent(chatId, env, firstUserMessage, messages, tracer);

    // Create the streaming response
    const dataStream = result.toDataStream({
      getErrorMessage: (error: any) => {
        return `Failed to generate response: ${error.message}`;
      },
    });

    // Record usage once the dataStream is closed.
    if (token) {
      result.usage
        .then(async (usage) => {
          const Authorization = `Bearer ${token}`;
          const url = `${PROVISION_HOST}/api/dashboard/teams/${teamSlug}/usage/record_tokens`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tokens: usage.totalTokens,
            }),
          });
          if (!response.ok) {
            logger.error('Failed to record usage', response);
            logger.error(await response.json());
          }
        })
        .catch((error) => {
          logger.error('Error in usage recording:', error);
        });
    }

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
