import { createFileRoute, redirect } from '@tanstack/react-router';
import { pinnedTabs, Tab, tabs } from './-tabs';
import MouseDownLink from '../components/MouseDownLink';
import BookmarkList from '../components/BookmarkList';
import { settingsStore } from '../components/SettingsContext';

// Captured at app boot: the startup redirect applies only when the site is
// loaded directly at the root URL (PWA launch, page refresh, typed URL).
// Direct loads of other pages and in-app navigation to root skip it.
const bootedAtRoot = window.location.pathname === '/';
let startupRedirectDone = false;

function HomePageIcon({ tab }: { tab: Tab }) {
  return (
    <MouseDownLink
      to={tab.to}
      className="flex flex-col items-center gap-2 p-4 hover:bg-base-300 transition-colors"
    >
      <tab.icon className="w-10 h-10 text-secondary" />
      <div className="text-center w-full text-sm overflow-visible flex flex-col items-center">
        <span>{tab.name}</span>
      </div>
    </MouseDownLink>
  );
}

function IconGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col pt-4">
      <div className="grid grid-cols-4">{children}</div>
      <div className="divider" />
    </div>
  );
}

function HomePage() {
  return (
    <div className="flex-1 p-2 overflow-y-auto self-center w-full max-w-250 bg-base-200">
      <IconGroup>
        {tabs.map(tab => (
          <HomePageIcon key={tab.name} tab={tab} />
        ))}
      </IconGroup>
      <IconGroup>
        {pinnedTabs.map(tab => (
          <HomePageIcon key={tab.name} tab={tab} />
        ))}
      </IconGroup>
      <BookmarkList />
    </div>
  );
}

export const Route = createFileRoute('/')({
  beforeLoad: ({ preload }) => {
    // Links to '/' are preloaded on sight; only redirect real navigations
    if (preload) return;
    const startupPage = settingsStore.get('startupPage');
    if (startupPage === '/' || !bootedAtRoot || startupRedirectDone) return;
    startupRedirectDone = true;
    return redirect({ to: startupPage });
  },
  component: HomePage,
});
