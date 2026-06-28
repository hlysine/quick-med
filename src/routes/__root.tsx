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

function Dock() {
  const location = useRouterState({ select: state => state.location });

  useEffect(() => {
    const tab = tabs.find(tab => location.pathname.startsWith(tab.to));
    if (tab) {
      document.title = `Quick Med - ${tab.name}`;
    }
  }, [location]);

  return (
    <div className="dock static hide-on-type">
      {dockTabs.map(tab => (
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
      <nav className="navbar py-0 bg-base-300 shadow-sm justify-between hide-on-type">
        <div className="breadcrumbs text-sm ms-2">
          <ul>
            <li>
              <a href="https://lysine-med.hf.space/">Med</a>
            </li>
            <li>
              <MouseDownLink to="/" className="btn btn-ghost text-xl">
                <img src="/logo.svg" alt="Logo" className="h-8 mr-2" />
                Quick Med
              </MouseDownLink>
            </li>
          </ul>
        </div>
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
