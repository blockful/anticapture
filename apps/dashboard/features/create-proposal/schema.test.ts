import { ProposalFormSchema } from "@/features/create-proposal/schema";

describe("ProposalFormSchema", () => {
  const valid = {
    title: "My proposal",
    discussionUrl: "https://discuss.ens.domains/t/1",
    body: "Body content",
    actions: [],
  };

  test("accepts a valid form", () => {
    expect(ProposalFormSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects empty title", () => {
    expect(ProposalFormSchema.safeParse({ ...valid, title: "" }).success).toBe(
      false,
    );
  });

  test("rejects non-URL discussion url", () => {
    expect(
      ProposalFormSchema.safeParse({ ...valid, discussionUrl: "not-a-url" })
        .success,
    ).toBe(false);
  });

  test("rejects body over 10,000 chars", () => {
    expect(
      ProposalFormSchema.safeParse({ ...valid, body: "a".repeat(10_001) })
        .success,
    ).toBe(false);
  });
});
