import {
  createRootRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import PWAPrompt from '../components/PWAPrompt';
import ThemeToggle from '../components/ThemeToggle';
import { useEffect } from 'react';
import MouseDownLink from '../components/MouseDownLink';
import { dockTabs, tabs } from './-tabs';
import { useSettings } from '../components/SettingsContext';

function Dock() {
  const location = useRouterState({ select: state => state.location });
  const [hiddenTabs] = useSettings('hiddenTabs');

  useEffect(() => {
    const tab = tabs.find(tab => location.pathname.startsWith(tab.to));
    if (tab) {
      document.title = `Quick Med - ${tab.name}`;
    }
  }, [location]);

  const visibleTabs = dockTabs.filter(tab => !hiddenTabs.includes(tab.to));

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div className="dock static hide-on-type">
      {visibleTabs.map(tab => (
        <MouseDownLink
          key={tab.name}
          to={tab.to}
          className={location.pathname.startsWith(tab.to) ? 'dock-active' : ''}
        >
          <tab.icon />
          <span className="dock-label">{tab.name}</span>
        </MouseDownLink>
      ))}
    </div>
  );
}

export const Route = createRootRoute({
  component: () => (
    <div className="w-full h-full flex flex-col">
      <nav className="navbar py-1 bg-base-300 shadow-sm justify-between hide-on-type">
        <MouseDownLink to="/" className="btn btn-ghost text-xl">
          <img src="/logo.svg" alt="Logo" className="h-8 mr-2" />
          Quick Med
        </MouseDownLink>
        <div className="flex gap-1 items-center">
          <PWAPrompt />
          <ThemeToggle />
        </div>
      </nav>
      <Outlet />
      <Dock />
      <TanStackRouterDevtools />
    </div>
  ),
});
