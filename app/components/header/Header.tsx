import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { useConvexSessionIdOrNullOrLoading } from '~/lib/stores/convex';
import { DeployButton } from './DeployButton';

export function Header() {
  const chat = useStore(chatStore);
  const sessionId = useConvexSessionIdOrNullOrLoading();

  if (sessionId === null) {
    return null;
  }

  return (
    <header
      className={classNames('flex items-center p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-xl font-semibold flex flex-col leading-tight">
          <div className="flex items-center gap-1">Convex Flow</div>
          <span className="flex items-center gap-1 text-xs">
            powered by <span className="i-bolt:logo-text?mask w-[26px] inline-block">Bolt</span>
          </span>
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-2">
                <DeployButton />
                <div className="mr-1">
                  <HeaderActionButtons />
                </div>
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
