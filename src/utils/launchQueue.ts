import type { AnyRouter } from '@tanstack/react-router';

// Web App Launch Handler API - not yet in TypeScript's DOM lib
// https://developer.chrome.com/docs/web-platform/launch-handler
interface LaunchParams {
  readonly targetURL?: string;
  readonly files?: readonly FileSystemHandle[];
}

interface LaunchQueue {
  setConsumer(consumer: (launchParams: LaunchParams) => void): void;
}

declare global {
  interface Window {
    launchQueue?: LaunchQueue;
  }
}

/**
 * Consumes PWA launches delivered via the Launch Handler API.
 *
 * With `launch_handler.client_mode: 'focus-existing'` in the web app manifest,
 * launching the installed PWA (e.g. from a link, thanks to
 * `handle_links: 'preferred'`) focuses the existing window and enqueues the
 * launch here instead of performing a full page load, so the target URL is
 * navigated to with client-side routing.
 */
export function setupLaunchQueue(router: AnyRouter) {
  if (!window.launchQueue) return;

  window.launchQueue.setConsumer(launchParams => {
    if (!launchParams.targetURL) return;

    const url = new URL(launchParams.targetURL, window.location.origin);

    // Only route launches within the app; leave cross-origin targets alone
    if (url.origin !== window.location.origin) return;

    // On a cold start the browser has already loaded the target URL
    if (url.href === window.location.href) return;

    void router.navigate({ href: url.pathname + url.search + url.hash });
  });
}
