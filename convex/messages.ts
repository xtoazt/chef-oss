import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Message as AIMessage } from 'ai';
import { ConvexError, v } from 'convex/values';
import type { VAny, Infer } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
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

export const addMessages = mutation({
  args: {
    sessionId: v.id('sessions'),
    id: v.string(),
    messages: v.array(v.any() as VAny<SerializedMessage>),
    description: v.optional(v.string()),
    metadata: v.optional(IChatMetadataValidator),
  },
  handler: async (ctx, args) => {
    const { id, sessionId, messages } = args;
    let existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

    if (!existing) {
      console.log('Creating new chat with id', id);
      await createNewChatFromMessages(ctx, {
        id,
        sessionId,
        description: args.description,
        metadata: args.metadata,
      });

      existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

      if (!existing) {
        throw new ConvexError({ code: 'NotFound', message: 'Chat not found' });
      }
    }

    const { slug, description } = await _appendMessages(ctx, {
      sessionId,
      chat: existing,
      messages,
    });

    return {
      id: slug,
      description,
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

    const chatId = await createNewChatFromMessages(ctx, {
      id: crypto.randomUUID(),
      sessionId: args.sessionId,
      description: `${existing.description || 'Chat'} (copy)`,
      metadata: existing.metadata,
    });
    const chat = await ctx.db.get(chatId);
    await _appendMessages(ctx, {
      sessionId: args.sessionId,
      chat: chat!,
      messages: messages.map((m) => m.content),
    });

    return {
      id: chatId,
      description: `${existing.description || 'Chat'} (copy)`,
    };
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

    const forkedChatId = await createNewChatFromMessages(ctx, {
      id: crypto.randomUUID(),
      sessionId: args.sessionId,
      description: `${chat.description} (fork)`,
      metadata: chat.metadata,
    });
    const forkedChat = await ctx.db.get(forkedChatId);
    await _appendMessages(ctx, {
      sessionId: args.sessionId,
      chat: forkedChat!,
      messages: messagesToFork.map((m) => m.content),
    });

    return {
      id: forkedChat!.urlId ?? forkedChat!.externalId,
      description: `${chat.description} (fork)`,
    };
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

    // xcxc
    // return createNewChatFromMessages(ctx, {
    //   url: {
    //     kind: 'hint',
    //     hint: urlHint,
    //   },
    //   sessionId,
    //   description,
    //   messages,
    //   metadata,
    // });
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
      urlId: result.urlId ?? result.externalId,
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

async function _appendMessages(
  ctx: MutationCtx,
  args: {
    sessionId: Id<'sessions'>;
    chat: Doc<'chats'>;
    messages: SerializedMessage[];
  },
) {
  const { chat, messages } = args;

  const lastMessage = await ctx.db
    .query('chatMessages')
    .withIndex('byChatId', (q) => q.eq('chatId', chat._id))
    .order('desc')
    .first();

  if (chat.urlId === undefined) {
    for (const message of messages) {
      const artifactIdAndTitle = extractArtifactIdAndTitle(message);

      if (artifactIdAndTitle) {
        const urlId = await _allocateUrlId(ctx, { urlHint: artifactIdAndTitle.id, sessionId: args.sessionId });
        await ctx.db.patch(chat._id, {
          urlId,
          description: artifactIdAndTitle.title,
        });
        break;
      }
    }
  }

  let rank = lastMessage ? lastMessage.rank + 1 : 0;

  if (lastMessage && lastMessage.content.id === messages[0].id) {
    await ctx.db.patch(lastMessage._id, {
      content: messages[0],
    });
    messages.shift();
  }

  for (const message of messages) {
    await ctx.db.insert('chatMessages', {
      chatId: chat._id,
      content: message,
      rank,
    });
    rank++;
  }

  const updatedSlug = chat.urlId ?? chat.externalId;
  const updatedDescription = chat.description;

  return {
    slug: updatedSlug,
    description: updatedDescription,
  };
}

function extractArtifactIdAndTitle(message: SerializedMessage) {
  // Example: <boltArtifact id="imported-files" title="Interactive Tic Tac Toe Game"
  if (typeof message.content !== 'string') {
    return null;
  }

  const match = message.content.match(/<boltArtifact id="([^"]+)" title="([^"]+)"/);

  return match ? { id: match[1], title: match[2] } : null;
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

export async function createNewChatFromMessages(
  ctx: MutationCtx,
  args: {
    id: string;
    sessionId: Id<'sessions'>;
    description?: string;
    metadata?: IChatMetadata;
  },
): Promise<Id<'chats'>> {
  const { id, sessionId, description, metadata } = args;
  const existing = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id, sessionId });

  if (existing) {
    throw new ConvexError({ code: 'InvalidState', message: 'Chat already exists' });
  }

  const chatId = await ctx.db.insert('chats', {
    creatorId: sessionId,
    externalId: id,
    description,
    timestamp: new Date().toISOString(),
    metadata,
  });

  return chatId;
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
