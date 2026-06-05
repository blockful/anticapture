import {
  readDrafts,
  removeDraft,
} from "@/features/create-proposal/utils/draftStorage";
import type { ProposalDraft } from "@/features/create-proposal/types";

const KEY = "wl-drafts-ens-0x1";

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => {
      data.delete(k);
    },
    setItem: (k, v) => {
      data.set(k, v);
    },
  };
}

const DRAFT_X: ProposalDraft = {
  id: "id-x",
  daoId: "ens",
  title: "X",
  discussionUrl: "",
  body: "",
  actions: [],
  createdAt: 1,
  updatedAt: 1,
};

describe("draftStorage", () => {
  describe("readDrafts", () => {
    test("returns empty list when storage missing", () => {
      expect(readDrafts(undefined, KEY)).toEqual([]);
    });

    test("returns empty list when key unset", () => {
      expect(readDrafts(createMemoryStorage(), KEY)).toEqual([]);
    });

    test("returns empty list on malformed JSON", () => {
      const storage = createMemoryStorage();
      storage.setItem(KEY, "{not json");
      expect(readDrafts(storage, KEY)).toEqual([]);
    });

    test("returns empty list when value is not an array", () => {
      const storage = createMemoryStorage();
      storage.setItem(KEY, JSON.stringify({ foo: 1 }));
      expect(readDrafts(storage, KEY)).toEqual([]);
    });

    test("returns parsed drafts", () => {
      const storage = createMemoryStorage();
      const drafts: ProposalDraft[] = [
        {
          id: "a",
          daoId: "ens",
          createdAt: 1,
          updatedAt: 1,
          title: "A",
          discussionUrl: "",
          body: "",
          actions: [],
        },
      ];
      storage.setItem(KEY, JSON.stringify(drafts));
      expect(readDrafts(storage, KEY)).toEqual(drafts);
    });
  });

  describe("removeDraft", () => {
    test("removes matching draft", () => {
      expect(removeDraft([DRAFT_X], "id-x")).toEqual([]);
    });

    test("no-op when id not found", () => {
      expect(removeDraft([DRAFT_X], "other")).toEqual([DRAFT_X]);
    });
  });
});
