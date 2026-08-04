import {
  stashImportedProposal,
  takeImportedProposal,
  type ImportedProposal,
} from "@/features/create-proposal/utils/importHandoff";

/*
 * The import runs on the proposals list and the form it fills is another route,
 * so these values cross a navigation, and sometimes a sign-in round trip. What
 * matters is that they arrive once, arrive for the right DAO, and never arrive
 * twice.
 */

/** Same shape draftStorage.test uses, installed as the global the module reads. */
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
    (globalThis as { sessionStorage?: Storage }).sessionStorage =
      createMemoryStorage();
  });

  it("carries the values across", () => {
    expect(stashImportedProposal("ens", proposal)).toBe(true);
    expect(takeImportedProposal("ens")).toEqual(proposal);
  });

  // Clearing on read is what stops a reload from re-applying an import the
  // author has since edited away.
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

  it("drops a corrupted stash instead of throwing", () => {
    sessionStorage.setItem("anticapture:pending-import:ens", "{not json");
    expect(takeImportedProposal("ens")).toBeNull();
    // Already removed, so a reload starts clean rather than failing the same way.
    expect(sessionStorage.getItem("anticapture:pending-import:ens")).toBeNull();
  });

  it("survives an empty actions list", () => {
    stashImportedProposal("ens", { actions: [] });
    expect(takeImportedProposal("ens")).toEqual({ actions: [] });
  });

  describe("when storage is unavailable", () => {
    const refuse = (method: "getItem" | "setItem") => {
      const storage = createMemoryStorage();
      storage[method] = () => {
        throw new Error("blocked");
      };
      (globalThis as { sessionStorage?: Storage }).sessionStorage = storage;
    };

    // The caller keeps the author in the dialog with their document rather than
    // navigating to a form that silently ignored it.
    it("reports a refused write", () => {
      refuse("setItem");
      expect(stashImportedProposal("ens", proposal)).toBe(false);
    });

    it("reads nothing on a refused read", () => {
      refuse("getItem");
      expect(takeImportedProposal("ens")).toBeNull();
    });
  });
});
