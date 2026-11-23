/**
 * localStorage, without its errors: some browsers throw when it is blocked
 * (private browsing, cookies disabled). The settings then last for the visit
 * only, instead of the app failing to start.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // not saved: kept in memory for this visit
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // nothing to remove
    }
  },
};
