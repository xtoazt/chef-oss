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

  /*
   * We create a session (if it does not exist) and store the ID in local storage.
   * We only show chats for the current session, so we rely on the session ID being
   * unguessable (i.e. we should never list session IDs or return them in function
   * results).
   */
  sessions: defineTable({}),

  /*
   * All chats have two IDs -- an `initialId` that is always set (UUID) and a `urlId`
   * that is more human friendly (e.g. "tic-tac-toe").
   * The `urlId` is set based on the LLM messages so is initially unset.
   * Both `initialId` and `urlId` should be unique within the creatorId, all functions
   * should accept either `initialId` or `urlId`, and when returning an identifier,
   * we should prefer `urlId` if it is set.
   */
  chats: defineTable({
    creatorId: v.id('sessions'),
    initialId: v.string(),
    urlId: v.optional(v.string()),
    description: v.optional(v.string()),
    timestamp: v.string(),
    metadata: v.optional(IChatMetadataValidator),
  })
    .index('byCreatorAndId', ['creatorId', 'initialId'])
    .index('byCreatorAndUrlId', ['creatorId', 'urlId']),

  chatMessages: defineTable({
    content: v.any() as VAny<SerializedMessage>,
    rank: v.number(),
    chatId: v.id('chats'),
  }).index('byChatId', ['chatId', 'rank']),
});
