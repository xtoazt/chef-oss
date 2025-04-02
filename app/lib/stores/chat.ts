import { useStore } from '@nanostores/react';
import { map } from 'nanostores';
import { chatIdStore } from '~/lib/persistence';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
});

export function useChatId(): string {
  const chatId = useStore(chatIdStore);
  if (chatId === undefined) {
    throw new Error('Chat ID is not set');
  }
  return chatId;
}
export function useChatIdOrNull(): string | null {
  const chatId = useStore(chatIdStore);
  return chatId ?? null;
}
