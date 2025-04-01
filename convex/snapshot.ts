import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getChatByIdOrUrlIdEnsuringAccess } from './messages';

// Generate a URL for uploading a snapshot file
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save the snapshot information after successful upload
export const saveSnapshot = mutation({
  args: {
    sessionId: v.id('sessions'),
    chatId: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { sessionId, chatId, storageId }) => {
    const chat = await getChatByIdOrUrlIdEnsuringAccess(ctx, { id: chatId, sessionId });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // If there's an existing snapshot, clean it up
    if (chat.snapshotId) {
      await ctx.storage.delete(chat.snapshotId);
    }

    await ctx.db.patch(chat._id, {
      snapshotId: storageId,
    });
  },
});
