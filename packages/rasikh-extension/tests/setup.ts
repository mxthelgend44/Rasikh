// tests/setup.ts
// A minimal in memory chrome mock so unit and integration tests can exercise state persistence and
// sender trust without a real extension runtime.
const sessionStore = new Map<string, any>();
const localStore = new Map<string, any>();

function area(store: Map<string, any>) {
  return {
    get: async (key: string | string[] | null) => {
      if (key == null) return Object.fromEntries(store);
      const keys = Array.isArray(key) ? key : [key];
      const out: Record<string, any> = {};
      for (const k of keys) if (store.has(k)) out[k] = store.get(k);
      return out;
    },
    set: async (obj: Record<string, any>) => {
      for (const k of Object.keys(obj)) store.set(k, obj[k]);
    },
    remove: async (key: string) => {
      store.delete(key);
    },
    clear: async () => {
      store.clear();
    }
  };
}

(globalThis as any).chrome = {
  runtime: { id: "self-id", lastError: undefined },
  storage: { session: area(sessionStore), local: area(localStore) }
};
