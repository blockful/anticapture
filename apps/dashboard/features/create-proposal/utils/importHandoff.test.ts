import {
  clearImportedProposal,
  stashImportedProposal,
  takeImportedProposal,
  type ImportedProposal,
} from "@/features/create-proposal/utils/importHandoff";

const createMemoryStorage = (): Storage => {
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
};

const proposal: ImportedProposal = {
  title: "Fund the thing",
  body: "## Synopsis",
  actions: [
    {
      type: "eth-transfer",
      recipient: "0x39D3F4633dE1F5E2a1e2f4d3fD6d1AAf2E9c8b71",
      amount: "600",
    },
  ],
};

describe("the import handoff", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage =
      createMemoryStorage();
  });

  it("carries the values across", () => {
    expect(stashImportedProposal("ens", proposal)).toBe(true);
    expect(takeImportedProposal("ens")).toEqual(proposal);
  });

  it("hands them over exactly once", () => {
    stashImportedProposal("ens", proposal);
    expect(takeImportedProposal("ens")).toEqual(proposal);
    expect(takeImportedProposal("ens")).toBeNull();
  });

  it("keeps one DAO's import off another's form", () => {
    stashImportedProposal("ens", proposal);
    expect(takeImportedProposal("shu")).toBeNull();
    expect(takeImportedProposal("ens")).toEqual(proposal);
  });

  it("reports nothing when no import is pending", () => {
    expect(takeImportedProposal("ens")).toBeNull();
  });

  describe("whatever case the route param arrives in", () => {
    it("reads a mixed-case stash back with a lowercase id", () => {
      expect(stashImportedProposal("ENS", proposal)).toBe(true);
      expect(takeImportedProposal("ens")).toEqual(proposal);
    });

    it("reads a lowercase stash back with a mixed-case id", () => {
      expect(stashImportedProposal("ens", proposal)).toBe(true);
      expect(takeImportedProposal("EnS")).toEqual(proposal);
    });

    it("still hands them over exactly once across cases", () => {
      stashImportedProposal("ENS", proposal);
      expect(takeImportedProposal("ens")).toEqual(proposal);
      expect(takeImportedProposal("ENS")).toBeNull();
    });

    it("keeps one DAO's import off another's form", () => {
      stashImportedProposal("ENS", proposal);
      expect(takeImportedProposal("SHU")).toBeNull();
      expect(takeImportedProposal("ens")).toEqual(proposal);
    });
  });

  const KEY = "anticapture:pending-import:ens";

  it("drops a corrupted stash instead of throwing", () => {
    localStorage.setItem(KEY, "{not json");
    expect(takeImportedProposal("ens")).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("drops a record that isn't the shape it writes", () => {
    localStorage.setItem(KEY, JSON.stringify({ title: "no wrapper" }));
    expect(takeImportedProposal("ens")).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("is readable from a context that never wrote it", () => {
    stashImportedProposal("ens", proposal);
    const carried = localStorage.getItem(KEY);

    (globalThis as { localStorage?: Storage }).localStorage =
      createMemoryStorage();
    localStorage.setItem(KEY, carried!);

    expect(takeImportedProposal("ens")).toEqual(proposal);
  });

  describe("a stash that sat too long", () => {
    const writtenAt = (ms: number) =>
      localStorage.setItem(KEY, JSON.stringify({ at: ms, values: proposal }));

    it("is refused once it is older than the window", () => {
      writtenAt(Date.now() - 61 * 60 * 1000);
      expect(takeImportedProposal("ens")).toBeNull();
    });

    it("is cleared rather than left to be refused again", () => {
      writtenAt(Date.now() - 61 * 60 * 1000);
      takeImportedProposal("ens");
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it("still arrives after a plausible mail round trip", () => {
      writtenAt(Date.now() - 10 * 60 * 1000);
      expect(takeImportedProposal("ens")).toEqual(proposal);
    });
  });

  it("survives an empty actions list", () => {
    stashImportedProposal("ens", { actions: [] });
    expect(takeImportedProposal("ens")).toEqual({ actions: [] });
  });

  describe("abandoning the handoff", () => {
    it("drops a stash whose navigation never happened", () => {
      stashImportedProposal("ens", proposal);
      clearImportedProposal("ens");
      expect(takeImportedProposal("ens")).toBeNull();
    });

    it("normalizes the id the same way the write did", () => {
      stashImportedProposal("ENS", proposal);
      clearImportedProposal("EnS");
      expect(takeImportedProposal("ens")).toBeNull();
    });

    it("leaves another DAO's pending import alone", () => {
      stashImportedProposal("ens", proposal);
      stashImportedProposal("shu", proposal);
      clearImportedProposal("ens");
      expect(takeImportedProposal("ens")).toBeNull();
      expect(takeImportedProposal("shu")).toEqual(proposal);
    });

    it("is a no-op when nothing is pending", () => {
      expect(() => clearImportedProposal("ens")).not.toThrow();
    });
  });

  describe("when storage is unavailable", () => {
    const refuse = (method: "getItem" | "setItem" | "removeItem") => {
      const storage = createMemoryStorage();
      storage[method] = () => {
        throw new Error("blocked");
      };
      (globalThis as { localStorage?: Storage }).localStorage = storage;
    };

    it("reports a refused write", () => {
      refuse("setItem");
      expect(stashImportedProposal("ens", proposal)).toBe(false);
    });

    it("reads nothing on a refused read", () => {
      refuse("getItem");
      expect(takeImportedProposal("ens")).toBeNull();
    });

    it("swallows a refused clear", () => {
      refuse("removeItem");
      expect(() => clearImportedProposal("ens")).not.toThrow();
    });
  });
});
