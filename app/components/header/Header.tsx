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
        <a href="/" className="text-2xl font-semibold flex flex-col leading-tight">
          <div className="flex items-center gap-2 ml-2 font-display font-bold">
            <svg width="24" height="24" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.4394 45.7293C28.4633 32.4205 45.4242 24.5157 65.3606 24.5157C85.5324 24.5157 103.151 33.2248 112.616 46.181C117.311 39.755 120 32.2843 120 24.3132C95.7597 -16.107 22.5435 -4.19645 18.4394 45.7293Z"
                fill="#f3a719"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.29043 82.6387C19.3144 69.3299 36.2753 61.4251 56.2117 61.4251C76.3835 61.4251 94.0022 70.1342 103.468 83.0904C108.162 76.6645 110.851 69.1937 110.851 61.2227C86.6107 20.8024 13.3946 32.713 9.29043 82.6387Z"
                fill="#eb2e29"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.2418e-05 119.548C8.04646 108.865 20.5628 101.664 35.5 99.2386C40.5558 98.4177 43 98.0956 48.5 98.3348C53.1946 91.9088 55.8835 84.4381 55.8835 76.467C43 76.467 39.6574 76.7253 31 80.4146C14.8198 87.3099 4.50003 99.2386 3.2418e-05 119.548Z"
                fill="#82216b"
              />
            </svg>
            Flow
          </div>
          {/* <span className="flex items-center gap-1 text-xs">
            powered by <span className="i-bolt:logo-text?mask w-[26px] inline-block">Bolt</span>
          </span> */}
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
