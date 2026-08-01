import { isProposalNotFoundError } from "@/features/governance/utils/proposalErrors";

describe("isProposalNotFoundError", () => {
  it("detects direct 404 errors from the generated client", () => {
    const error = new Error("Not Found") as Error & { status: number };
    error.status = 404;

    expect(isProposalNotFoundError(error)).toBe(true);
  });

  it("detects nested response 404 errors from query clients", () => {
    const error: Error & { response: { status: number } } = Object.assign(
      new Error("Not Found"),
      { response: { status: 404 } },
    );

    expect(isProposalNotFoundError(error)).toBe(true);
  });

  it("does not classify non-404 errors as not found", () => {
    const error = new Error("Internal Server Error") as Error & {
      status: number;
    };
    error.status = 500;

    expect(isProposalNotFoundError(error)).toBe(false);
  });
});
