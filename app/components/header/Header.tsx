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
          <div className="flex items-center ml-2 font-display font-bold">
            <svg id="b" xmlns="http://www.w3.org/2000/svg" width="43.53" height="22" viewBox="0 0 138.51 70.02">
              <defs>
                <style>
                  {`.d{fill:var(--bolt-elements-textPrimary);}.e{fill:#f2b01c;}.f{fill:none;stroke-width:2px;}.f,.g{stroke:var(--bolt-elements-textPrimary);stroke-miterlimit:10;}.g{fill:#fff;}.h{fill:#8e2876;}.i{fill:#ef3731;}`}
                </style>
              </defs>
              <g id="c">
                <rect
                  className="d"
                  x="63.07"
                  y="18.47"
                  width="77.3"
                  height="5.4"
                  transform="translate(2.24 51.13) rotate(-28.52)"
                />
                <path
                  className="d"
                  d="M88.37,33.11c-1.54,9.19-3.84,18.89-38.23,30.27-35.46,11.74-43.37,5.84-48.73-1.78-5.26-7.48,4.84-15.6,38.93-27.01,30.52-10.22,49.63-10.98,48.03-1.47Z"
                />
                <ellipse
                  className="g"
                  cx="44.13"
                  cy="44.14"
                  rx="45.33"
                  ry="9.22"
                  transform="translate(-11.55 15.93) rotate(-18.14)"
                />
                <path
                  className="e"
                  d="M55.11,44.1h0c13.56-4.9,25.82-11.11,31.85-16.74-.69,9.27-31.94,25.22-59.86,30.86-2.57.52-4.86.73-6.53.59-6.88-.59-9.94-3.22-8.06-7.12,9.4,1.14,26.75-1.95,42.61-7.59Z"
                />
                <path
                  className="h"
                  d="M17.45,51.39h0c-4.54,4.17-3.84,7.07,3.46,7.26-24.1,4.13-26.23-3.22-4.88-13.94,1.98-.99,4.38-1.98,6.96-2.86,10.61-3.6,21.69-6.33,29.77-7.31-15.4,5.08-29.78,11.94-35.32,16.85Z"
                />
                <path
                  className="i"
                  d="M58.17,34.06h0c-8.21.53-20.49,3.09-33.49,7.3,24.41-10.32,56.39-17.03,61.4-13.09.47.37.21.98-.77,1.77-4.11,3.29-12.36,7.5-22.35,11.33,6.61-4.98,4.67-7.8-4.79-7.31Z"
                />
                <ellipse
                  className="d"
                  cx="135.72"
                  cy="2.7"
                  rx="2.79"
                  ry="2.69"
                  transform="translate(5.9 42.39) rotate(-18.14)"
                />
                <ellipse
                  className="f"
                  cx="43.93"
                  cy="43.37"
                  rx="45.27"
                  ry="9.14"
                  transform="translate(-11.69 16.59) rotate(-18.92)"
                />
              </g>
            </svg>
            <span className="-ml-1">chef</span>
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
