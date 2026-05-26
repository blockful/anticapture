import { encodeDescription } from "@/features/create-proposal/utils/encodeDescription";
import { decodeDescription } from "@/features/create-proposal/utils/decodeDescription";

describe("encodeDescription", () => {
  test("produces description", () => {
    expect(
      encodeDescription(
        "My proposal",
        "https://discuss.example/1",
        "Body text",
      ),
    ).toBe("# My proposal\n\nhttps://discuss.example/1\n\nBody text");
  });

  test("omits discussion URL section when blank", () => {
    expect(encodeDescription("My proposal", "", "Body text")).toBe(
      "# My proposal\n\nBody text",
    );
    expect(encodeDescription("My proposal", "   ", "Body text")).toBe(
      "# My proposal\n\nBody text",
    );
  });
});

describe("decodeDescription", () => {
  test("round-trips with encodeDescription", () => {
    const encoded = encodeDescription("T", "https://x.io/y", "Hello");
    expect(decodeDescription(encoded)).toEqual({
      title: "T",
      discussionUrl: "https://x.io/y",
      body: "Hello",
    });
  });

  test("handles missing discussion url gracefully", () => {
    expect(decodeDescription("# Title only\n\nBody")).toEqual({
      title: "Title only",
      discussionUrl: "",
      body: "Body",
    });
  });
});
