import { create } from 'zustand';

export type AppRoute =
  | { name: 'SOLO' }
  | { name: 'ROOM'; roomCode: string };

export function parseRoute(pathname: string): AppRoute {
  const roomMatch = pathname.match(/^\/rooms\/([a-zA-Z0-9_-]+)/);
  if (roomMatch && roomMatch[1]) {
    return { name: 'ROOM', roomCode: roomMatch[1].toUpperCase() };
  }
  return { name: 'SOLO' };
}

interface RouterStore {
  pathname: string;
  route: AppRoute;
  navigate: (to: string, replace?: boolean) => void;
}

export const useRouterStore = create<RouterStore>((set) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      const currentPath = window.location.pathname;
      set({ pathname: currentPath, route: parseRoute(currentPath) });
    });
  }

  return {
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    route: parseRoute(typeof window !== 'undefined' ? window.location.pathname : '/'),
    navigate: (to: string, replace = false) => {
      if (typeof window !== 'undefined') {
        if (replace) {
          window.history.replaceState(null, '', to);
        } else {
          window.history.pushState(null, '', to);
        }
      }
      set({ pathname: to, route: parseRoute(to) });
    },
  };
});

export function useRouter() {
  const pathname = useRouterStore((s) => s.pathname);
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);

  return {
    pathname,
    route,
    navigate,
  };
}
