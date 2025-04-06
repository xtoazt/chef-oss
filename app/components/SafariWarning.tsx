import { useEffect, useState } from 'react';
import { Dialog, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';

export function SafariWarning() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is on Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    // Check if user is on mobile
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isSafari) {
      setIsOpen(true);
      setIsMobile(isMobileDevice);
    }
  }, []);

  return (
    <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
      <Dialog showCloseButton={false} className="max-w-[90vw] md:max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <svg
              id="b"
              xmlns="http://www.w3.org/2000/svg"
              width="43.53"
              height="22"
              viewBox="0 0 138.51 70.02"
              className="w-8 h-8"
            >
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
            <DialogTitle className="flex items-center gap-2">
              {isMobile ? 'Grab your laptop' : "You're a couple keystrokes away"}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-4">
            {isMobile ? (
              <>
                Chef uses{' '}
                <a
                  href="https://webcontainers.io/guides/browser-support#web-platform-requirements"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  WebContainers
                </a>{' '}
                in ways that require a desktop browser. Get cooking with desktop Chrome or Firefox!
              </>
            ) : (
              <>
                Chef uses{' '}
                <a
                  href="https://webcontainers.io/guides/browser-support#web-platform-requirements"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  WebContainers
                </a>{' '}
                in ways that are only supported in Firefox, Google Chrome, and some other Chromium-based browsers.
              </>
            )}
          </DialogDescription>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
