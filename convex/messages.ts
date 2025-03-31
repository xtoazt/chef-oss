import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Message as AIMessage } from 'ai';
import { ConvexError, v } from 'convex/values';
import type { VAny, Infer } from 'convex/values';
import type { Id } from './_generated/dataModel';
export type SerializedMessage = Omit<AIMessage, 'createdAt'> & {
  createdAt: number | undefined;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const IChatMetadataValidator = v.object({
  gitUrl: v.string(),
  gitBranch: v.optional(v.string()),
  netlifySiteId: v.optional(v.string()),
});

type IChatMetadata = Infer<typeof IChatMetadataValidator>;

export const set = mutation({
  args: {
    sessionId: v.id('sessions'),
    id: v.string(),
    messages: v.array(v.any() as VAny<SerializedMessage>),
    url: v.union(
      v.object({
        kind: v.literal('id'),
        id: v.string(),
      }),
      v.object({
        kind: v.literal('hint'),
        hint: v.string(),
      }),
    ),
    description: v.optional(v.string()),
    timestamp: v.optional(v.string()),
    metadata: v.optional(IChatMetadataValidator),
  },
  handler: async (ctx, args) => {
    const chat = await _setMessages(ctx, args);

    if (!chat) {
      throw new Error('Failed to create chat');
    }

    return {
      id: chat.externalId,
      urlId: chat.urlId,
    };
  },
});

export const setDescription = mutation({
  args: {
    sessionId: v.id('sessions'),
    id: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, description } = args;
    const existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId: args.sessionId });

    if (!existing) {
      throw new ConvexError({ code: 'NotFound', message: 'Chat not found' });
    }

    await ctx.db.patch(existing._id, {
      description,
    });
  },
});

export const setMetadata = mutation({
  args: {
    sessionId: v.id('sessions'),
    id: v.string(),
    metadata: IChatMetadataValidator,
  },
  handler: async (ctx, args) => {
    const { id, metadata, sessionId } = args;
    const existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

    if (!existing) {
      throw new ConvexError({ code: 'NotFound', message: 'Chat not found' });
    }

    await ctx.db.patch(existing._id, {
      metadata,
    });
  },
});

export const duplicate = mutation({
  args: {
    sessionId: v.id('sessions'),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId: args.sessionId });

    if (!existing) {
      throw new ConvexError({ code: 'NotFound', message: 'Chat not found' });
    }

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('byChatId', (q) => q.eq('chatId', existing._id))
      .collect();

    return createNewChatFromMessages(ctx, {
      url: {
        kind: 'hint',
        hint: existing.urlId,
      },
      sessionId: args.sessionId,
      description: `${existing.description || 'Chat'} (copy)`,
      messages: messages.map((m) => m.content),
      metadata: existing.metadata,
    });
  },
});

export const fork = mutation({
  args: {
    sessionId: v.id('sessions'),
    id: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, messageId, sessionId } = args;
    const chat = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

    if (!chat) {
      throw new ConvexError({ code: 'NotFound', message: 'Chat not found' });
    }

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('byChatId', (q) => q.eq('chatId', chat._id))
      .collect();

    // Find the index of the message to fork at
    const messageIndex = messages.findIndex((msg) => msg.content.id === messageId);

    if (messageIndex === -1) {
      throw new ConvexError({ code: 'NotFound', message: 'Message not found' });
    }

    // Get messages up to and including the selected message
    const messagesToFork = messages.slice(0, messageIndex + 1);

    return createNewChatFromMessages(ctx, {
      url: {
        kind: 'hint',
        hint: chat.urlId,
      },
      sessionId: args.sessionId,
      description: `${chat.description} (fork)`,
      messages: messagesToFork.map((m) => m.content),
      metadata: chat.metadata,
    });
  },
});

export const createFromMessages = mutation({
  args: {
    sessionId: v.id('sessions'),
    description: v.string(),
    urlHint: v.string(),
    messages: v.array(v.any() as VAny<SerializedMessage>),
    metadata: v.optional(IChatMetadataValidator),
  },
  handler: async (ctx, args) => {
    const { description, messages, metadata, sessionId, urlHint } = args;

    return createNewChatFromMessages(ctx, {
      url: {
        kind: 'hint',
        hint: urlHint,
      },
      sessionId,
      description,
      messages,
      metadata,
    });
  },
});

export const get = query({
  args: {
    id: v.string(),
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const { id, sessionId } = args;
    return getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });
  },
});

export const getWithMessages = query({
  args: {
    id: v.string(),
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const { id, sessionId } = args;
    const chat = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

    if (!chat) {
      return null;
    }

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('byChatId', (q) => q.eq('chatId', chat._id))
      .collect();

    return { ...chat, messages: messages.map((m) => m.content) };
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db.query('chats').collect();
    return results.map((result) => ({
      externalId: result.externalId,
      urlId: result.urlId,
      description: result.description,
      timestamp: result.timestamp,
      metadata: result.metadata,
    }));
  },
});

export const remove = mutation({
  args: {
    id: v.string(),
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const { id, sessionId } = args;
    const existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

    if (!existing) {
      return;
    }

    await ctx.db.delete(existing._id);
  },
});

export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query('chats').collect();

    for (const chat of chats) {
      await ctx.db.delete(chat._id);
    }
  },
});

async function _setMessages(
  ctx: MutationCtx,
  args: {
    sessionId: Id<'sessions'>;
    id: string;
    url: UrlArg;
    appendedMessages?: SerializedMessage[];
    description?: string;
    timestamp?: string;
    metadata?: IChatMetadata;
  },
) {
  const { id, appendedMessages, description, timestamp, metadata, sessionId, url } = args;
  const existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

  if (existing) {
    await ctx.db.replace(existing._id, {
      creatorId: sessionId,
      externalId: existing.externalId,
      urlId: existing.urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      metadata,
    });

    const lastMessage = await ctx.db
      .query('chatMessages')
      .withIndex('byChatId', (q) => q.eq('chatId', existing._id))
      .order('desc')
      .first();
    let rank = lastMessage?.rank ?? 0;

    if (appendedMessages) {
      for (const message of appendedMessages) {
        await ctx.db.insert('chatMessages', {
          chatId: existing._id,
          content: message,
          rank,
        });
        rank++;
      }
    }

    return ctx.db.get(existing._id);
  }

  if (url.kind !== 'hint') {
    throw new ConvexError({ code: 'InvalidState', message: 'URL id cannot be given for new chats' });
  }

  const urlId = await _allocateUrlId(ctx, { urlHint: url.hint, sessionId });

  const chatId = await ctx.db.insert('chats', {
    creatorId: sessionId,
    externalId: id,
    urlId,
    description,
    timestamp: timestamp ?? new Date().toISOString(),
    metadata,
  });

  let rank = 0;

  if (appendedMessages) {
    for (const message of appendedMessages) {
      await ctx.db.insert('chatMessages', {
        chatId,
        content: message,
        rank,
      });
      rank++;
    }
  }

  return ctx.db.get(chatId);
}

async function _allocateUrlId(ctx: QueryCtx, { urlHint, sessionId }: { urlHint: string; sessionId: Id<'sessions'> }) {
  const existing = await getChatByUrlId(ctx, { id: urlHint, sessionId });

  if (existing === null) {
    return urlHint;
  }

  let i = 2;

  while (true) {
    const newUrlId = `${urlHint}-${i}`;

    const m = await getChatByUrlId(ctx, { id: newUrlId, sessionId });

    if (m === null) {
      return newUrlId;
    }

    i++;
  }
}

type UrlArg =
  | {
      kind: 'id';

      // Must be unique across all chats for this session
      id: string;
    }
  | {
      kind: 'hint';

      // Used as a hint to generate a unique id
      hint: string;
    };

export async function createNewChatFromMessages(
  ctx: MutationCtx,
  args: {
    url: UrlArg;
    sessionId: Id<'sessions'>;
    description: string;
    messages: SerializedMessage[];
    metadata?: IChatMetadata;
  },
): Promise<string> {
  const { url, sessionId, description, messages, metadata } = args;
  const newId = await crypto.randomUUID();

  const chat = await _setMessages(ctx, {
    sessionId,
    id: newId,
    appendedMessages: messages,
    url,
    description,
    timestamp: undefined, // Use the current timestamp
    metadata,
  });

  return chat!.urlId!;
}

function getChatById(ctx: QueryCtx, { id, sessionId }: { id: string; sessionId: Id<'sessions'> }) {
  return ctx.db
    .query('chats')
    .withIndex('byCreatorAndId', (q) => q.eq('creatorId', sessionId).eq('externalId', id))
    .unique();
}

function getChatByUrlId(ctx: QueryCtx, { id, sessionId }: { id: string; sessionId: Id<'sessions'> }) {
  return ctx.db
    .query('chats')
    .withIndex('byCreatorAndUrlId', (q) => q.eq('creatorId', sessionId).eq('urlId', id))
    .unique();
}

async function getChatByIdOrUrlIdEnsuringAccess(
  ctx: QueryCtx,
  { id, sessionId }: { id: string; sessionId: Id<'sessions'> },
) {
  const byId = await getChatById(ctx, { id, sessionId });

  if (byId !== null) {
    return byId;
  }

  const byUrlId = await getChatByUrlId(ctx, { id, sessionId });

  return byUrlId;
}

export const startSession = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.db.insert('sessions', {});
  },
});
