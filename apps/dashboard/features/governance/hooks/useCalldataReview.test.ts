import { findCalldataReview } from "@/features/governance/hooks/useCalldataReview";

const reviews = [
  { name: "ep-6-39", url: "u1" },
  { name: "93 - UNIfication", url: "u2" },
  { name: "dsr-allocation", url: "u3" },
];

describe("findCalldataReview", () => {
  it("matches ENS proposals by the EP number in the title", () => {
    expect(
      findCalldataReview(reviews, {
        id: "0xabc",
        title: "[EP 6.39] Do a thing",
      }),
    ).toEqual(reviews[0]);
  });

  it("matches numbered folders by proposal id", () => {
    expect(
      findCalldataReview(reviews, { id: "93", title: "UNIfication" }),
    ).toEqual(reviews[1]);
  });

  it("does not match a different proposal number", () => {
    expect(
      findCalldataReview(reviews, { id: "0xabc", title: "[EP 6.4] Other" }),
    ).toBeUndefined();
    expect(
      findCalldataReview(reviews, { id: "94", title: "UNIfication" }),
    ).toBeUndefined();
  });

  it("matches slug folders by title", () => {
    expect(
      findCalldataReview(reviews, { id: "1", title: "DSR allocation update" }),
    ).toEqual(reviews[2]);
  });
});
