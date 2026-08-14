import { useRouterState } from '@tanstack/react-router';
import { clsx, type ClassValue } from 'clsx';
import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isPWA() {
  return ['fullscreen', 'standalone', 'minimal-ui'].some(
    displayMode => window.matchMedia(`(display-mode: ${displayMode})`).matches
  );
}

export function useTextFragment() {
  const { location } = useRouterState();
  useEffect(() => {
    if (location.hash.startsWith(':~:')) {
      window.location.replace(location.href);
    }
  }, [location]);
}
