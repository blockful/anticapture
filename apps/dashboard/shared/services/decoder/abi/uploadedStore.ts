import type { Abi } from "viem";

const GLOBAL_KEY = "*";

export type UploadedAbiStore = {
  /** Per-target ABI when one was set, else the global one, else null. */
  get(target?: string): Abi | null;
  /** Omit `target` to set the global ABI (standalone raw-paste mode). */
  set(abi: Abi, target?: string): void;
  clear(target?: string): void;
  /** Drops every entry (no version bump when already empty). */
  clearAll(): void;
  /**
   * Bumps on every mutation. Part of the decode query key, so an upload
   * automatically re-decodes everything that consulted the store.
   */
  readonly version: number;
};

export const createUploadedAbiStore = (
  onChange?: (version: number) => void,
): UploadedAbiStore => {
  const entries = new Map<string, Abi>();
  let version = 0;

  const bump = () => {
    version += 1;
    onChange?.(version);
  };

  return {
    get(target) {
      if (target) {
        const scoped = entries.get(target.toLowerCase());
        if (scoped) return scoped;
      }
      return entries.get(GLOBAL_KEY) ?? null;
    },
    set(abi, target) {
      entries.set(target ? target.toLowerCase() : GLOBAL_KEY, abi);
      bump();
    },
    clear(target) {
      entries.delete(target ? target.toLowerCase() : GLOBAL_KEY);
      bump();
    },
    clearAll() {
      if (entries.size === 0) return;
      entries.clear();
      bump();
    },
    get version() {
      return version;
    },
  };
};
