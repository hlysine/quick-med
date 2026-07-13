import { createLazyFileRoute } from '@tanstack/react-router';
import { SiteSettings, useSettings } from '../components/SettingsContext';
import { dockTabs } from './-tabs';
import { cn } from '../utils/uiUtils';
import { Suspense, use, useMemo } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import StyledMarkdown from '../components/markdown/StyledMarkdown';

async function cleanReload() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Unregistering ${registrations.length} service workers`);
    await Promise.all(
      registrations.map(r => {
        return r.unregister();
      })
    );
  } finally {
    window.location.href = new URL(window.location.href).origin;
  }
}

const changelogPromise = import('../../CHANGELOG.md?raw').then(module =>
  module.default.replace(/\r\n|\r|\n/g, '\n')
);
function ChangelogText() {
  const content = use(changelogPromise);
  return <StyledMarkdown>{content}</StyledMarkdown>;
}

function Changelog() {
  return (
    <div className="w-full flex flex-col">
      <button
        className="btn"
        onClick={() =>
          (
            document.getElementById('changelog_modal') as HTMLDialogElement
          ).showModal()
        }
      >
        Open changelog
      </button>
      <dialog id="changelog_modal" className="modal">
        <div className="modal-box max-h-[90%]">
          <div className="flex items-center w-full justify-between">
            <h3 className="font-bold text-lg">Changelog</h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost">✕</button>
            </form>
          </div>
          <Suspense
            fallback={
              <span className="skeleton block w-full max-w-100 h-screen my-4"></span>
            }
          >
            <ChangelogText />
          </Suspense>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

function SettingsToggle({
  settingsKey,
  label,
}: {
  settingsKey: keyof {
    [T in keyof SiteSettings as SiteSettings[T] extends boolean ? T : never]: T;
  };
  label: string;
}) {
  const [value, setValue] = useSettings(settingsKey);
  return (
    <label className="label inline-flex justify-between items-center">
      <span className="text-base-content">{label}</span>
      <input
        type="checkbox"
        className="toggle"
        checked={value}
        onChange={e => setValue(e.target.checked)}
      />
    </label>
  );
}

function DockTabToggles() {
  const [hiddenTabs, setHiddenTabs] = useSettings('hiddenTabs');
  return (
    <div className="flex flex-col gap-2">
      {dockTabs.map(tab => {
        const visible = !hiddenTabs.includes(tab.to);
        return (
          <label
            key={tab.to}
            className="label inline-flex justify-between items-center"
          >
            <span className="text-base-content">{tab.name}</span>
            <input
              type="checkbox"
              className="toggle"
              checked={visible}
              onChange={() =>
                setHiddenTabs(
                  visible
                    ? [...hiddenTabs, tab.to]
                    : hiddenTabs.filter(t => t !== tab.to)
                )
              }
            />
          </label>
        );
      })}
    </div>
  );
}

function ClearBookmarks() {
  const [bookmarks, setBookmarks] = useSettings('bookmarks');
  return (
    <div className="w-full flex flex-col">
      <button
        className={cn('btn', bookmarks.length === 0 && 'btn-disabled')}
        onClick={() =>
          (
            document.getElementById('clearBookmarksModal') as HTMLDialogElement
          ).showModal()
        }
      >
        Clear bookmarks
      </button>
      {bookmarks.length === 0 && (
        <p className="text-sm text-error mt-2">No bookmarks to clear.</p>
      )}
      <dialog id="clearBookmarksModal" className="modal">
        <div className="modal-box">
          <p>Are you sure you want to clear all bookmarks?</p>
          <div className="modal-action">
            <form method="dialog">
              <button
                className="btn btn-error"
                onClick={() => setBookmarks([])}
              >
                Yes
              </button>
            </form>
            <form method="dialog">
              <button className="btn">No</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

function SuggestEdits() {
  return (
    <div className="w-full flex flex-col">
      <a className="btn" href="/admin">
        Suggest edits
      </a>
      <p className="text-sm text-error mt-2">
        Your edits will be saved as public drafts and published after review.
      </p>
    </div>
  );
}

function ForceUpdate() {
  return (
    <div className="w-full flex flex-col">
      <button className="btn btn-error btn-outline" onClick={cleanReload}>
        Force Update
      </button>
      <p className="text-sm text-error mt-2">
        Make sure you have a stable internet connection before proceeding.
      </p>
    </div>
  );
}

function Settings() {
  const isPWA = useMemo(() => {
    return ['fullscreen', 'standalone', 'minimal-ui'].some(
      displayMode =>
        window.matchMedia('(display-mode: ' + displayMode + ')').matches
    );
  }, []);
  const {
    needRefresh: [needRefresh],
  } = useRegisterSW();
  return (
    <div className="flex-1 flex p-4 flex-col gap-2 w-full mt-2 max-w-250 self-center overflow-y-auto *:shrink-0">
      <h1 className="text-4xl font-bold">Quick Med</h1>
      <p className="text-xl">On-call helper</p>
      <p className="text-sm">
        Version {String(import.meta.env.VITE_PACKAGE_VERSION)}
      </p>
      <Changelog />
      <div className="divider" />
      {isPWA ? (
        <p>Successfully installed as a Progressive Web App.</p>
      ) : (
        <p>
          Install this site as a Progressive Web App for quick access. Select{' '}
          <b>Add to Home Screen</b> in your browser menu to get started.
        </p>
      )}
      {needRefresh ? (
        <p className="text-sm">- Update available. Please refresh the page</p>
      ) : (
        <p className="text-sm">- Up to date</p>
      )}
      <div className="divider" />
      <div className="flex flex-col gap-8 w-full max-w-100 self-center">
        <h2 className="text-2xl font-bold">Settings</h2>
        <SettingsToggle
          key="isDark"
          settingsKey="isDark"
          label="Use Dark Mode"
        />
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Dock tabs</h3>
          <DockTabToggles />
        </div>
        <ClearBookmarks />
        <SuggestEdits />
        <ForceUpdate />
      </div>
    </div>
  );
}

export const Route = createLazyFileRoute('/settings')({
  component: Settings,
});
