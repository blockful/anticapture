import type { DecodedParam } from "@/shared/services/decoder/types";
import { arrayParamView } from "@/shared/utils/arrayParamView";

const element = (i: number): DecodedParam => ({
  name: `[${i}]`,
  type: "address",
  value: "0x26D5EB37002152186ec86B9835ecAf32846bC0DD",
  isAddress: true,
});

/** An `address[250]` as the decoder emits it: 100 elements plus the note. */
const truncated: DecodedParam = {
  name: "recipients",
  type: "address[]",
  value: "250 items",
  originalLength: 250,
  children: [
    ...Array.from({ length: 100 }, (_, i) => element(i)),
    {
      name: "…",
      type: "address",
      value: "150 more items not shown",
      isTruncationNote: true,
    },
  ],
};

describe("arrayParamView", () => {
  test("labels a truncated array by its encoded length, not the render tree", () => {
    const view = arrayParamView(truncated, 3);
    // 101 children would spell address[101] and offer "98 more".
    expect(view.length).toBe(250);
    expect(view.visible).toHaveLength(3);
    expect(view.hidden).toBe(247);
    expect(view.retained).toBe(100);
    expect(view.folded).toBe(97);
    expect(view.note?.value).toBe("150 more items not shown");
  });

  test("expanding shows every retained element and keeps the note out of them", () => {
    const view = arrayParamView(truncated, null);
    expect(view.visible).toHaveLength(100);
    expect(view.visible.some((child) => child.isTruncationNote)).toBe(false);
    expect(view.folded).toBe(0);
    // 100 shown plus the 150 the note accounts for is the whole array.
    expect(view.hidden).toBe(150);
  });

  test("an array the budget emptied has nothing to reveal", () => {
    const view = arrayParamView(
      {
        name: "batch",
        type: "address[]",
        value: "99 items",
        originalLength: 99,
        children: [
          {
            name: "…",
            type: "address",
            value: "99 more items not shown",
            isTruncationNote: true,
          },
        ],
      },
      3,
    );
    expect(view.visible).toEqual([]);
    expect(view.folded).toBe(0);
    expect(view.length).toBe(99);
  });

  test("an untruncated container reports itself unchanged", () => {
    const view = arrayParamView(
      {
        name: "targets",
        type: "address[]",
        value: "2 items",
        originalLength: 2,
        children: [element(0), element(1)],
      },
      3,
    );
    expect(view.length).toBe(2);
    expect(view.visible).toHaveLength(2);
    expect(view.hidden).toBe(0);
    expect(view.folded).toBe(0);
    expect(view.note).toBeUndefined();
  });

  test("a param without children is an empty view", () => {
    const view = arrayParamView(
      { name: "to", type: "address", value: "0x00" },
      3,
    );
    expect(view.visible).toEqual([]);
    expect(view.length).toBe(0);
  });
});
