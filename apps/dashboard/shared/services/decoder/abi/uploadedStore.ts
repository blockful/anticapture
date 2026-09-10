import type { Abi } from "viem";

const GLOBAL_KEY = "*";

export type UploadedAbiStore = {
  /**
   * Per-target ABI for a targeted lookup; the global entry answers ONLY
   * targetless lookups. A recursively extracted child always has a concrete
   * target, and the root's pasted ABI must not preempt that child's own
   * known/OpenChain resolution just because a selector matches.
   */
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
  /**
   * Stable random identity for this store instance. Also part of the decode
   * query key: version counters restart at zero on remount, and two stores
   * must never collide on the long-lived React Query cache.
   */
  readonly id: string;
};

export const createUploadedAbiStore = (
  onChange?: (version: number) => void,
): UploadedAbiStore => {
  const entries = new Map<string, Abi>();
  let version = 0;
  const id = Math.random().toString(36).slice(2, 10);

  const bump = () => {
    version += 1;
    onChange?.(version);
  };

  return {
    get(target) {
      if (target) return entries.get(target.toLowerCase()) ?? null;
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
    id,
  };
};
