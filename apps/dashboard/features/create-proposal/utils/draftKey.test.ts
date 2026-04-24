import { draftKey } from "@/features/create-proposal/utils/draftKey";

describe("draftKey", () => {
  test("builds key with lowercased daoId and address", () => {
    expect(draftKey("ENS", "0xAbCdEf0000000000000000000000000000000001")).toBe(
      "drafts-ens-0xabcdef0000000000000000000000000000000001",
    );
  });
});
