import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import type { Messages } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';
import { convexAgent } from '~/lib/.server/llm/convex-agent';

const logger = createScopedLogger('api.chat');

export async function action(args: ActionFunctionArgs) {
  return chatAction(args, args.context.cloudflare.env);
}

async function chatAction({ request }: ActionFunctionArgs, env: Env) {
  const body = await request.json<{ messages: Messages, firstUserMessage: boolean }>();
  const { messages, firstUserMessage } = body;
  try {
    const totalMessageContent = messages.reduce((acc, message) => acc + message.content, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);

    const dataStream = await convexAgent(env, firstUserMessage, messages);
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