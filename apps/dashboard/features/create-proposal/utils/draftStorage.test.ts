import {
  readDrafts,
  removeDraft,
  upsertDraft,
  writeDrafts,
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

function baseInput(title = "T") {
  return {
    daoId: "ens",
    title,
    discussionUrl: "",
    body: "",
    actions: [],
  };
}

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

  describe("writeDrafts", () => {
    test("no-ops when storage missing", () => {
      expect(() => writeDrafts(undefined, KEY, [])).not.toThrow();
    });

    test("persists JSON-serialized drafts", () => {
      const storage = createMemoryStorage();
      writeDrafts(storage, KEY, []);
      expect(storage.getItem(KEY)).toBe("[]");
    });
  });

  describe("upsertDraft", () => {
    test("appends new draft and returns generated id", () => {
      const { next, savedId } = upsertDraft(
        [],
        baseInput("T"),
        1000,
        () => "gen-id",
      );
      expect(savedId).toBe("gen-id");
      expect(next).toHaveLength(1);
      expect(next[0]).toMatchObject({
        id: "gen-id",
        title: "T",
        createdAt: 1000,
        updatedAt: 1000,
      });
    });

    test("updates existing draft preserving createdAt", () => {
      const first = upsertDraft([], baseInput("T1"), 1000, () => "id-1");
      const { next, savedId } = upsertDraft(
        first.next,
        baseInput("T2"),
        2000,
        () => "should-not-be-used",
        "id-1",
      );
      expect(savedId).toBe("id-1");
      expect(next).toHaveLength(1);
      expect(next[0]).toMatchObject({
        id: "id-1",
        title: "T2",
        createdAt: 1000,
        updatedAt: 2000,
      });
    });

    test("treats unknown id as insert", () => {
      const { next, savedId } = upsertDraft(
        [],
        baseInput("T"),
        1000,
        () => "gen-id",
        "missing",
      );
      expect(savedId).toBe("gen-id");
      expect(next).toHaveLength(1);
    });
  });

  describe("removeDraft", () => {
    test("removes matching draft", () => {
      const { next } = upsertDraft([], baseInput("X"), 1, () => "id-x");
      expect(removeDraft(next, "id-x")).toEqual([]);
    });

    test("no-op when id not found", () => {
      const { next } = upsertDraft([], baseInput("X"), 1, () => "id-x");
      expect(removeDraft(next, "other")).toEqual(next);
    });
  });
});
