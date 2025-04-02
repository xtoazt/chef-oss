import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { atom } from 'nanostores';
import type { Message } from '@ai-sdk/react';
import { toast } from 'react-toastify';
import { useConvex } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ConvexError } from 'convex/values';
import type { SerializedMessage } from '@convex/messages';
import { useConvexSessionIdOrNullOrLoading } from '~/lib/stores/convex';
import { getLocalStorage, setLocalStorage } from '~/lib/persistence/localStorage';
import type { Id } from '@convex/_generated/dataModel';
import { workbenchStore } from '../stores/workbench';

export interface IChatMetadata {
  gitUrl: string;
  gitBranch?: string;
  netlifySiteId?: string;
}

export interface ChatHistoryItem {
  /*
   * ID should be the urlId (if it's set) or the initialId, and callers should be able
   * to handle either
   */
  id: string;
  initialId: string;
  urlId?: string;
  description?: string;
  timestamp: string;
  metadata?: IChatMetadata;
}

/*
 * This is the ID of the currently active chat -- it can be a human-friendly URL ID (e.g. `tic-tac-toe`)
 * if it's been set, or the initially allocated ID (a UUID). Callers should be able to handle either.
 */
export const chatIdStore = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);
export const chatMetadata = atom<IChatMetadata | undefined>(undefined);

export const useChatHistoryConvex = () => {
  const navigate = useNavigate();

  // mixedId means either an initialId or a urlId
  const { id: mixedId } = useLoaderData<{ id?: string; sessionId?: string }>();
  const [searchParams] = useSearchParams();

  const [initialMessages, setInitialMessages] = useState<SerializedMessage[]>([]);
  const [initialDeserializedMessages, setInitialDeserializedMessages] = useState<Message[]>([]);

  const [persistedMessages, setPersistedMessages] = useState<Message[]>([]);
  const persistInProgress = useRef(false);

  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();
  const sessionId = useConvexSessionIdOrNullOrLoading();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const convex = useConvex();
  useEffect(() => {
    if (sessionId === undefined || sessionId === null) {
      return;
    }
    if (mixedId === undefined) {
      navigate('/', { replace: true });
      return;
    }

    setIsLoading(true);

    // TODO -- this should clear `initialMessages` if the chat has changed

    convex
      .query(api.messages.getWithMessages, { id: mixedId, sessionId })
      .then((rawMessages) => {
        if (rawMessages !== null && rawMessages.messages.length > 0) {
          const rewindId = searchParams.get('rewindTo');
          const filteredMessages = rewindId
            ? rawMessages.messages.slice(0, rawMessages.messages.findIndex((m) => m.id === rewindId) + 1)
            : rawMessages.messages;

          setInitialMessages(filteredMessages);
          console.log('initialMessages', filteredMessages);
          setInitialDeserializedMessages(filteredMessages.map(deserializeMessageForConvex));
          setUrlId(rawMessages.urlId);
          description.set(rawMessages.description);
          chatIdStore.set(rawMessages.id);
          chatMetadata.set(rawMessages.metadata);
          setReady(true);

          workbenchStore.setReloadedMessages(filteredMessages.map((m) => m.id));
        } else {
          console.log('navigating to /');
          navigate('/', { replace: true });
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      });
  }, [mixedId, sessionId, convex]);

  return {
    ready: mixedId === undefined || (ready && !isLoading),
    initialMessages: initialDeserializedMessages,
    updateChatMetadata: async (metadata: IChatMetadata) => {
      const id = chatIdStore.get();

      if (!id || !sessionId) {
        return;
      }

      try {
        await convex.mutation(api.messages.setMetadata, {
          id,
          sessionId,
          metadata,
        });
        chatMetadata.set(metadata);
      } catch (error) {
        toast.error('Failed to update chat metadata');
        console.error(error);
      }
    },
    storeMessageHistory: async (messages: Message[]) => {
      if (messages.length === 0) {
        return;
      }

      if (!sessionId) {
        return;
      }

      /*
       * Synchronously allocate a new ID -- this ID is temporary and will be replaced by a
       * more human-friendly ID when the first message is added.
       */
      if (initialMessages.length === 0 && !chatIdStore.get()) {
        const nextId = crypto.randomUUID();
        chatIdStore.set(nextId);
      }

      const id = chatIdStore.get() as string;

      if (persistInProgress.current) {
        return;
      }

      const messagesToAdd = findMessagesToUpdate(initialMessages.length, persistedMessages, messages);

      if (messagesToAdd.length === 0) {
        return;
      }

      persistInProgress.current = true;

      const result = await convex.mutation(api.messages.addMessages, {
        id,
        sessionId,
        messages: messagesToAdd.map(serializeMessageForConvex),
        expectedLength: messages.length,
      });

      setPersistedMessages(messages);
      persistInProgress.current = false;

      // Update the description + URL ID if they have changed
      if (description.get() !== result.description) {
        description.set(result.description);
      }

      if (urlId !== result.id) {
        setUrlId(result.id);
        navigateChat(result.id);
      }
    },
    duplicateCurrentChat: async (listItemId: string) => {
      if (!sessionId) {
        return;
      }

      if (!mixedId && !listItemId) {
        return;
      }

      try {
        const newId = await convex.mutation(api.messages.duplicate, {
          id: mixedId || listItemId,
          sessionId,
        });
        navigate(`/chat/${newId}`);
        toast.success('Chat duplicated successfully');
      } catch (error) {
        toast.error('Failed to duplicate chat');
        console.log(error);
      }
    },
    importChat: async (description: string, messages: Message[], metadata?: IChatMetadata) => {
      if (!sessionId) {
        return;
      }

      try {
        const newId = await convex.mutation(api.messages.importChat, {
          description,
          messages: messages.map(serializeMessageForConvex),
          metadata,
          sessionId,
        });
        window.location.href = `/chat/${newId}`;
        toast.success('Chat imported successfully');
      } catch (error) {
        if (error instanceof ConvexError) {
          toast.error('Failed to import chat: ' + error.message);
        } else {
          toast.error('Failed to import chat');
        }
      }
    },
    exportChat: async (id = urlId) => {
      if (!id || !sessionId) {
        return;
      }

      const chat = await convex.query(api.messages.getWithMessages, { id, sessionId });

      if (!chat) {
        return;
      }

      const chatData = {
        messages: chat.messages,
        description: chat.description,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
};

function navigateChat(nextId: string) {
  /**
   * FIXME: Using the intended navigate function causes a rerender for <Chat /> that breaks the app.
   *
   * `navigate(`/chat/${nextId}`, { replace: true });`
   */
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;

  window.history.replaceState({}, '', url);
}

function serializeMessageForConvex(message: Message) {
  return {
    ...message,
    createdAt: message.createdAt?.getTime() ?? undefined,
  };
}

function deserializeMessageForConvex(message: SerializedMessage): Message {
  return {
    ...message,
    createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
  };
}

function findMessagesToUpdate(initialMessagesLength: number, persistedMessages: Message[], currentMessages: Message[]) {
  if (persistedMessages.length > currentMessages.length) {
    console.error('Unexpected state -- more persisted messages than current messages');
    return [];
  }

  if (initialMessagesLength > persistedMessages.length) {
    // Initial messages should never change. Update with everything after the initial messages.
    return currentMessages.slice(initialMessagesLength);
  }

  /*
   * We assume that changes to the messages either are edits to the last persisted message, or
   * new messages.
   *
   * We want to avoid sending the entire message history on every change, so we only send the
   * changed messages.
   *
   * In theory, `Message` that are semantically the same are `===` to each other, but empirically
   * that's not always true. But occasional false positive means extra no-op calls to persistence,
   * which should be fine (the persisted state should still be correct).
   */
  for (let i = persistedMessages.length - 1; i < currentMessages.length; i++) {
    if (currentMessages[i] !== persistedMessages[i]) {
      return currentMessages.slice(i);
    }
  }

  return [];
}
