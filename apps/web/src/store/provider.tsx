'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { AppState } from '@/domain/types';
import { LiveStore, type Connection } from './live-store';
import type { Snapshot } from './snapshot';

const StoreContext = createContext<LiveStore | null>(null);

export function StoreProvider({ initial, children }: { initial: Snapshot; children: ReactNode }) {
  const [store] = useState(() => new LiveStore(initial));

  useEffect(() => {
    store.connect();
    return () => store.disconnect();
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): LiveStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

/** The whole shared state. Derive what you need with selectors and `useMemo`. */
export function useAppState(): AppState {
  const store = useStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().state,
    () => store.getSnapshot().state,
  );
}

export function useConnection(): Connection {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getConnection, () => 'connecting');
}
