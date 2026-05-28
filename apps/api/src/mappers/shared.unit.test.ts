import { z } from "@hono/zod-openapi";
import { describe, it, expect } from "vitest";
import { getAddress, zeroAddress } from "viem";

import {
  addressOutputField,
  addressPathParams,
  addressesQueryFilter,
  affectedSupplyFlagsFields,
  AddressArraySchema,
  AddressQueryArraySchema,
  AddressSchema,
  bigIntRangeQueryParams,
  bigintAsStringField,
  commaDelimitedEnumQueryParam,
  daoIdField,
  decimalStringField,
  defaultDescOrderDirection,
  earliestLatestDateRangeQueryParams,
  inclusiveDateRangeQueryParams,
  logIndexField,
  normalizeQueryArray,
  paginatedListResponse,
  paginationLimitQueryParam,
  paginationQueryParams,
  paginationSkipQueryParam,
  TimestampResponseMapper,
  txHashField,
  unixSecondsIntField,
  unixSecondsStringField,
  unixTimestampQueryParam,
} from "./shared";
import { PERIOD_UNBOUND } from "./constants";

const SAMPLE_ADDRESS = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SAMPLE_ADDRESS_2 = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("AddressSchema", () => {
  it("accepts a lowercase address and returns its checksummed form", () => {
    expect(AddressSchema.parse(SAMPLE_ADDRESS)).toBe(
      getAddress(SAMPLE_ADDRESS),
    );
  });

  it("rejects a non-hex string", () => {
    expect(() => AddressSchema.parse("not-an-address")).toThrow();
  });

  it("rejects a hex string of the wrong length", () => {
    expect(() => AddressSchema.parse("0x1234")).toThrow();
  });
});

describe("AddressArraySchema", () => {
  it("parses an array of addresses to checksummed form", () => {
    expect(
      AddressArraySchema.parse([SAMPLE_ADDRESS, SAMPLE_ADDRESS_2]),
    ).toEqual([getAddress(SAMPLE_ADDRESS), getAddress(SAMPLE_ADDRESS_2)]);
  });

  it("rejects when any element is invalid", () => {
    expect(() => AddressArraySchema.parse([SAMPLE_ADDRESS, "bad"])).toThrow();
  });
});

describe("AddressQueryArraySchema", () => {
  it("wraps a single string into a one-element array", () => {
    expect(AddressQueryArraySchema.parse(SAMPLE_ADDRESS)).toEqual([
      getAddress(SAMPLE_ADDRESS),
    ]);
  });

  it("passes an array through unchanged but checksummed", () => {
    expect(
      AddressQueryArraySchema.parse([SAMPLE_ADDRESS, SAMPLE_ADDRESS_2]),
    ).toEqual([getAddress(SAMPLE_ADDRESS), getAddress(SAMPLE_ADDRESS_2)]);
  });
});

describe("normalizeQueryArray", () => {
  it("returns undefined for null, undefined, or empty string", () => {
    expect(normalizeQueryArray(null)).toBeUndefined();
    expect(normalizeQueryArray(undefined)).toBeUndefined();
    expect(normalizeQueryArray("")).toBeUndefined();
  });

  it("splits a comma-delimited string into an array", () => {
    expect(normalizeQueryArray("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("flattens an array of comma-delimited strings", () => {
    expect(normalizeQueryArray(["a,b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("wraps a non-string scalar in a one-element array", () => {
    expect(normalizeQueryArray(42)).toEqual([42]);
  });
});

describe("paginationSkipQueryParam", () => {
  it("defaults to 0 when the query value is absent", () => {
    expect(paginationSkipQueryParam().parse(undefined)).toBe(0);
  });

  it("coerces a numeric string", () => {
    expect(paginationSkipQueryParam().parse("12")).toBe(12);
  });

  it("rejects negative numbers", () => {
    expect(() => paginationSkipQueryParam().parse(-1)).toThrow();
  });
});

describe("paginationLimitQueryParam", () => {
  it("defaults to 10 when the query value is absent", () => {
    expect(paginationLimitQueryParam().parse(undefined)).toBe(10);
  });

  it("respects an override default", () => {
    expect(paginationLimitQueryParam(undefined, 25).parse(undefined)).toBe(25);
  });

  it("rejects values above the max", () => {
    expect(() =>
      paginationLimitQueryParam(undefined, 10, 100).parse(200),
    ).toThrow();
  });

  it("rejects 0", () => {
    expect(() => paginationLimitQueryParam().parse(0)).toThrow();
  });
});

describe("unixTimestampQueryParam", () => {
  it("coerces a numeric string", () => {
    expect(unixTimestampQueryParam("when").parse("1700000000")).toBe(
      1700000000,
    );
  });

  it("rejects non-integer values", () => {
    expect(() => unixTimestampQueryParam("when").parse(1.5)).toThrow();
  });

  it("treats absence as undefined", () => {
    expect(unixTimestampQueryParam("when").parse(undefined)).toBeUndefined();
  });
});

describe("addressOutputField / decimalStringField", () => {
  it("addressOutputField accepts any string at runtime", () => {
    expect(addressOutputField("Account address.").parse("anything")).toBe(
      "anything",
    );
  });

  it("decimalStringField accepts any string at runtime", () => {
    expect(
      decimalStringField("Voting power encoded as a decimal string.").parse(
        "12345",
      ),
    ).toBe("12345");
  });
});

describe("txHashField / daoIdField", () => {
  it("txHashField accepts any string", () => {
    expect(txHashField().parse("0xdeadbeef")).toBe("0xdeadbeef");
  });

  it("daoIdField accepts any string", () => {
    expect(daoIdField().parse("ens")).toBe("ens");
  });
});

describe("paginatedListResponse", () => {
  const ItemSchema = z.object({ id: z.string() });

  it("parses a well-formed { items, totalCount } payload", () => {
    expect(
      paginatedListResponse(ItemSchema).parse({
        items: [{ id: "a" }, { id: "b" }],
        totalCount: 2,
      }),
    ).toEqual({ items: [{ id: "a" }, { id: "b" }], totalCount: 2 });
  });

  it("rejects when totalCount is missing", () => {
    expect(() =>
      paginatedListResponse(ItemSchema).parse({ items: [{ id: "a" }] }),
    ).toThrow();
  });

  it("rejects when an item fails its own schema", () => {
    expect(() =>
      paginatedListResponse(ItemSchema).parse({
        items: [{ id: 1 }],
        totalCount: 1,
      }),
    ).toThrow();
  });
});

describe("defaultDescOrderDirection", () => {
  it("defaults to 'desc' when omitted", () => {
    expect(defaultDescOrderDirection().parse(undefined)).toBe("desc");
  });

  it("accepts 'asc'", () => {
    expect(defaultDescOrderDirection().parse("asc")).toBe("asc");
  });

  it("rejects other values", () => {
    expect(() => defaultDescOrderDirection().parse("sideways")).toThrow();
  });
});

describe("logIndexField", () => {
  it("accepts a non-negative integer", () => {
    expect(logIndexField().parse(0)).toBe(0);
    expect(logIndexField().parse(42)).toBe(42);
  });

  it("rejects non-integers", () => {
    expect(() => logIndexField().parse(1.5)).toThrow();
  });
});

describe("unixSecondsStringField", () => {
  it("accepts a string timestamp", () => {
    expect(unixSecondsStringField("Transfer").parse("1704067200")).toBe(
      "1704067200",
    );
  });

  it("rejects a number", () => {
    expect(() =>
      unixSecondsStringField("Transfer").parse(1704067200),
    ).toThrow();
  });
});

describe("unixSecondsIntField", () => {
  it("accepts a non-negative integer", () => {
    expect(
      unixSecondsIntField("Proposal start timestamp in Unix seconds.").parse(
        1700000000,
      ),
    ).toBe(1700000000);
  });

  it("rejects a string", () => {
    expect(() =>
      unixSecondsIntField("Proposal start timestamp in Unix seconds.").parse(
        "1700000000",
      ),
    ).toThrow();
  });
});

describe("inclusiveDateRangeQueryParams", () => {
  const Schema = z.object({
    ...inclusiveDateRangeQueryParams("the comparison window"),
  });

  it("returns object with fromDate and toDate keys", () => {
    const fields = inclusiveDateRangeQueryParams("foo");
    expect(Object.keys(fields)).toEqual(["fromDate", "toDate"]);
  });

  it("coerces numeric-string inputs on both bounds", () => {
    expect(
      Schema.parse({ fromDate: "1700000000", toDate: "1710000000" }),
    ).toEqual({ fromDate: 1700000000, toDate: 1710000000 });
  });

  it("treats both bounds as optional", () => {
    expect(Schema.parse({})).toEqual({
      fromDate: undefined,
      toDate: undefined,
    });
  });
});

describe("earliestLatestDateRangeQueryParams", () => {
  const Schema = z.object({
    ...earliestLatestDateRangeQueryParams("vote"),
  });

  it("returns object with fromDate and toDate keys", () => {
    const fields = earliestLatestDateRangeQueryParams("foo");
    expect(Object.keys(fields)).toEqual(["fromDate", "toDate"]);
  });

  it("coerces numeric-string inputs on both bounds", () => {
    expect(
      Schema.parse({ fromDate: "1700000000", toDate: "1710000000" }),
    ).toEqual({ fromDate: 1700000000, toDate: 1710000000 });
  });
});

describe("paginationQueryParams", () => {
  it("returns skip/limit fields with bare defaults", () => {
    const Schema = z.object({ ...paginationQueryParams() });
    expect(Schema.parse({})).toEqual({ skip: 0, limit: 10 });
  });

  it("honors limitDefault override", () => {
    const Schema = z.object({ ...paginationQueryParams({ limitDefault: 25 }) });
    expect(Schema.parse({})).toEqual({ skip: 0, limit: 25 });
  });

  it("coerces string inputs", () => {
    const Schema = z.object({ ...paginationQueryParams() });
    expect(Schema.parse({ skip: "5", limit: "20" })).toEqual({
      skip: 5,
      limit: 20,
    });
  });
});

describe("bigIntRangeQueryParams", () => {
  const Schema = z.object({ ...bigIntRangeQueryParams("balance") });

  it("returns fromValue and toValue keys", () => {
    expect(Object.keys(bigIntRangeQueryParams("x"))).toEqual([
      "fromValue",
      "toValue",
    ]);
  });

  it("transforms decimal strings to BigInt", () => {
    expect(
      Schema.parse({ fromValue: "10", toValue: "9999999999999999999" }),
    ).toEqual({ fromValue: 10n, toValue: 9999999999999999999n });
  });

  it("treats both bounds as optional", () => {
    expect(Schema.parse({})).toEqual({
      fromValue: undefined,
      toValue: undefined,
    });
  });

  it("rejects non-numeric strings", () => {
    expect(() => Schema.parse({ fromValue: "not-a-number" })).toThrow();
  });
});

describe("addressesQueryFilter", () => {
  const Schema = z.object({ addresses: addressesQueryFilter() });

  it("wraps a single address string in a one-element array", () => {
    expect(Schema.parse({ addresses: SAMPLE_ADDRESS })).toEqual({
      addresses: [getAddress(SAMPLE_ADDRESS)],
    });
  });

  it("passes an array of addresses through", () => {
    expect(
      Schema.parse({ addresses: [SAMPLE_ADDRESS, SAMPLE_ADDRESS_2] }),
    ).toEqual({
      addresses: [getAddress(SAMPLE_ADDRESS), getAddress(SAMPLE_ADDRESS_2)],
    });
  });

  it("treats absence as undefined", () => {
    expect(Schema.parse({})).toEqual({ addresses: undefined });
  });
});

describe("commaDelimitedEnumQueryParam", () => {
  const Statuses = ["ACTIVE", "CLOSED", "PENDING"] as const;

  it("parses a comma-delimited string into an enum array", () => {
    expect(
      commaDelimitedEnumQueryParam(Statuses).parse("ACTIVE,CLOSED"),
    ).toEqual(["ACTIVE", "CLOSED"]);
  });

  it("parses an array input", () => {
    expect(
      commaDelimitedEnumQueryParam(Statuses).parse(["ACTIVE", "PENDING"]),
    ).toEqual(["ACTIVE", "PENDING"]);
  });

  it("applies a normalizer before enum validation", () => {
    expect(
      commaDelimitedEnumQueryParam(Statuses, (v) => v.toUpperCase()).parse(
        "active,closed",
      ),
    ).toEqual(["ACTIVE", "CLOSED"]);
  });

  it("rejects values outside the enum", () => {
    expect(() => commaDelimitedEnumQueryParam(Statuses).parse("FOO")).toThrow();
  });

  it("returns undefined for empty input", () => {
    expect(commaDelimitedEnumQueryParam(Statuses).parse("")).toBeUndefined();
  });
});

describe("affectedSupplyFlagsFields", () => {
  const Schema = z.object({ ...affectedSupplyFlagsFields("transfer") });

  it("returns the four expected boolean keys", () => {
    expect(Object.keys(affectedSupplyFlagsFields("x"))).toEqual([
      "isCex",
      "isDex",
      "isLending",
      "isTotal",
    ]);
  });

  it("parses a well-formed flags object", () => {
    expect(
      Schema.parse({
        isCex: true,
        isDex: false,
        isLending: true,
        isTotal: false,
      }),
    ).toEqual({
      isCex: true,
      isDex: false,
      isLending: true,
      isTotal: false,
    });
  });

  it("rejects a missing flag", () => {
    expect(() =>
      Schema.parse({ isCex: true, isDex: false, isLending: true }),
    ).toThrow();
  });

  it("rejects a non-boolean", () => {
    expect(() =>
      Schema.parse({
        isCex: "yes",
        isDex: false,
        isLending: false,
        isTotal: false,
      }),
    ).toThrow();
  });
});

describe("addressPathParams", () => {
  const Schema = addressPathParams("MyParams", "Path params for foo.");

  it("validates and checksums the address", () => {
    expect(Schema.parse({ address: SAMPLE_ADDRESS })).toEqual({
      address: getAddress(SAMPLE_ADDRESS),
    });
  });

  it("rejects a malformed address", () => {
    expect(() => Schema.parse({ address: "not-an-address" })).toThrow();
  });
});

describe("bigintAsStringField", () => {
  it("stringifies a bigint input", () => {
    expect(bigintAsStringField().parse(123n)).toBe("123");
  });

  it("passes a string input through unchanged", () => {
    expect(bigintAsStringField().parse("9999999999999999999")).toBe(
      "9999999999999999999",
    );
  });

  it("rejects a number input", () => {
    expect(() => bigintAsStringField().parse(123)).toThrow();
  });

  it("accepts a description override without changing parse behavior", () => {
    expect(bigintAsStringField("Voting power").parse(7n)).toBe("7");
  });
});

describe("TimestampResponseMapper", () => {
  it("returns ISO-8601 for a numeric Unix timestamp", () => {
    expect(TimestampResponseMapper(1700000000)).toBe(
      new Date(1700000000 * 1000).toISOString(),
    );
  });

  it("returns PERIOD_UNBOUND for undefined", () => {
    expect(TimestampResponseMapper(undefined)).toBe(PERIOD_UNBOUND);
  });

  it("returns PERIOD_UNBOUND for 0", () => {
    expect(TimestampResponseMapper(0)).toBe(PERIOD_UNBOUND);
  });
});

describe("zeroAddress sanity check (viem import)", () => {
  // Sanity guard: the viem import is used elsewhere; keeping a tiny check ensures
  // the test file's import surface isn't accidentally pruned by linters.
  it("is the canonical zero address", () => {
    expect(zeroAddress).toBe("0x0000000000000000000000000000000000000000");
  });
});
