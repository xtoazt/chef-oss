import { useEffect, useState } from 'react';
import { Dialog, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';

export function SafariWarning() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user is on Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
      setIsOpen(true);
    }
  }, []);

  return (
    <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
      <Dialog showCloseButton={false}>
        <div className="p-6">
          <DialogTitle className="flex items-center gap-2">
            <span className="i-ph:warning-circle-fill text-yellow-500" />
            Works best (at all) in Chrome
          </DialogTitle>
          <DialogDescription className="mt-4">
            This agent coding prototype uses{' '}
            <a
              href="https://webcontainers.io/guides/browser-support#web-platform-requirements"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              WebContainers
            </a>{' '}
            in ways that are are only supported in Chrome and some other Chromium-based browsers.
          </DialogDescription>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
