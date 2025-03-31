import { defineSchema, defineTable } from 'convex/server';
import { v, type VAny } from 'convex/values';
import { IChatMetadataValidator } from './messages';
import type { SerializedMessage } from './messages';

export default defineSchema({
  projects: defineTable({
    text: v.string(),
    subject: v.string(),
    convexToken: v.optional(v.string()),
  })
    .index('by_subject', ['subject'])
    .index('by_subject_and_convex_token', ['subject', 'convexToken']),
  sessions: defineTable({}),
  chats: defineTable({
    creatorId: v.id('sessions'),
    externalId: v.string(),
    urlId: v.string(),
    description: v.optional(v.string()),
    timestamp: v.string(),
    metadata: v.optional(IChatMetadataValidator),
  })
    .index('byCreatorAndId', ['creatorId', 'externalId'])
    .index('byCreatorAndUrlId', ['creatorId', 'urlId']),

  chatMessages: defineTable({
    content: v.any() as VAny<SerializedMessage>,
    rank: v.number(),
    chatId: v.id('chats'),
  }).index('byChatId', ['chatId', 'rank']),
});
