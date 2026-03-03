import { createElement } from "react";

import {
  serializeCsvValue,
  flattenRow,
  formatCsvData,
} from "@/shared/utils/csvSerializer";

describe("serializeCsvValue", () => {
  test("returns empty string for null", () => {
    expect(serializeCsvValue(null)).toBe("");
  });

  test("returns empty string for undefined", () => {
    expect(serializeCsvValue(undefined)).toBe("");
  });

  test("serializes strings", () => {
    expect(serializeCsvValue("hello")).toBe("hello");
  });

  test("escapes double quotes in strings", () => {
    expect(serializeCsvValue('say "hi"')).toBe('say ""hi""');
  });

  test("serializes numbers", () => {
    expect(serializeCsvValue(1234.56)).toBe("1234.56");
  });

  test("serializes zero", () => {
    expect(serializeCsvValue(0)).toBe("0");
  });

  test("serializes booleans", () => {
    expect(serializeCsvValue(true)).toBe("true");
    expect(serializeCsvValue(false)).toBe("false");
  });

  test("serializes Date to ISO string", () => {
    const date = new Date("2025-01-15T12:00:00Z");
    expect(serializeCsvValue(date)).toBe("2025-01-15T12:00:00.000Z");
  });

  test("joins arrays of primitives with comma", () => {
    expect(serializeCsvValue(["CEX", "DEX", "Treasury"])).toBe(
      "CEX, DEX, Treasury",
    );
  });

  test("joins arrays of numbers", () => {
    expect(serializeCsvValue([1, 2, 3])).toBe("1, 2, 3");
  });

  test("joins arrays of Dates as ISO strings", () => {
    const dates = [
      new Date("2025-01-01T00:00:00Z"),
      new Date("2025-06-15T12:00:00Z"),
    ];
    expect(serializeCsvValue(dates)).toBe(
      "2025-01-01T00:00:00.000Z, 2025-06-15T12:00:00.000Z",
    );
  });

  test("extracts text from object with text property", () => {
    expect(serializeCsvValue({ text: "Passed", percentage: 75 })).toBe(
      "Passed",
    );
  });

  test("returns empty string for React elements", () => {
    const element = createElement("span", null, "hello");
    expect(serializeCsvValue(element)).toBe("");
  });

  test("returns empty string for unknown objects without text", () => {
    expect(serializeCsvValue({ foo: "bar" })).toBe("");
  });
});

describe("flattenRow", () => {
  test("flattens a simple flat row", () => {
    const row = { address: "0x123", balance: 1000, active: true };
    const result = flattenRow(row);

    expect(result).toEqual({
      address: "0x123",
      balance: "1000",
      active: "true",
    });
  });

  test("handles null values as empty strings", () => {
    const row = { address: "0x123", delegate: null };
    const result = flattenRow(row);

    expect(result).toEqual({
      address: "0x123",
      delegate: "",
    });
  });

  test("flattens nested objects with prefix", () => {
    const row = {
      address: "0x123",
      variation: { percentageChange: 5.2, absoluteChange: 100 },
    };
    const result = flattenRow(row);

    expect(result).toEqual({
      address: "0x123",
      variation_percentageChange: "5.2",
      variation_absoluteChange: "100",
    });
  });

  test("flattens deeply nested objects", () => {
    const row = {
      delegation: { from: { address: "0xabc" }, value: "500" },
    };
    const result = flattenRow(row);

    expect(result).toEqual({
      delegation_from_address: "0xabc",
      delegation_value: "500",
    });
  });

  test("extracts text from objects with text and icon", () => {
    const icon = createElement("span", null, "icon");
    const row = {
      finalResult: { text: "Passed", icon },
      userVote: { text: "For", icon },
    };
    const result = flattenRow(row);

    expect(result).toEqual({
      finalResult: "Passed",
      userVote: "For",
    });
  });

  test("skips React element values entirely", () => {
    const element = createElement("div", null, "content");
    const row = {
      address: "0x123",
      iconField: element,
      balance: 500,
    };
    const result = flattenRow(row);

    expect(result).toEqual({
      address: "0x123",
      balance: "500",
    });
  });

  test("handles arrays as comma-separated values (quoted)", () => {
    const row = {
      id: "tx1",
      affectedSupply: ["CEX", "DEX"],
    };
    const result = flattenRow(row);

    expect(result).toEqual({
      id: "tx1",
      affectedSupply: '"CEX, DEX"',
    });
  });

  test("quotes values containing commas", () => {
    const row = { description: "hello, world" };
    const result = flattenRow(row);

    expect(result).toEqual({
      description: '"hello, world"',
    });
  });

  test("quotes values containing semicolons (CSV separator)", () => {
    const row = { label: "foo; bar" };
    const result = flattenRow(row);

    expect(result).toEqual({
      label: '"foo; bar"',
    });
  });

  test("quotes text-object values containing semicolons", () => {
    const row = { timing: { text: "Early; 3d avg" } };
    const result = flattenRow(row);

    expect(result).toEqual({
      timing: '"Early; 3d avg"',
    });
  });

  test("quotes text-object values containing commas", () => {
    const row = { timing: { text: "Early, on time" } };
    const result = flattenRow(row);

    expect(result).toEqual({
      timing: '"Early, on time"',
    });
  });

  test("handles variation with null value", () => {
    const row = {
      address: "0x123",
      balance: 1000,
      variation: null,
    };
    const result = flattenRow(row);

    expect(result).toEqual({
      address: "0x123",
      balance: "1000",
      variation: "",
    });
  });

  test("handles Date values", () => {
    const date = new Date("2025-06-15T00:00:00Z");
    const row = { timestamp: date };
    const result = flattenRow(row);

    expect(result).toEqual({
      timestamp: "2025-06-15T00:00:00.000Z",
    });
  });
});

describe("formatCsvData", () => {
  test("transforms array of rows", () => {
    const data = [
      { address: "0x123", balance: 1000 },
      { address: "0x456", balance: 2000 },
    ];
    const result = formatCsvData(data);

    expect(result).toEqual([
      { address: "0x123", balance: "1000" },
      { address: "0x456", balance: "2000" },
    ]);
  });

  test("handles empty array", () => {
    expect(formatCsvData([])).toEqual([]);
  });

  test("flattens nested objects across rows", () => {
    const data = [
      {
        address: "0x123",
        variation: { percentageChange: 5, absoluteChange: 100 },
      },
    ];
    const result = formatCsvData(data);

    expect(result).toEqual([
      {
        address: "0x123",
        variation_percentageChange: "5",
        variation_absoluteChange: "100",
      },
    ]);
  });

  test("simulates delegate table data for CSV export", () => {
    const data = [
      {
        address: "0xdelegate1",
        votingPower: 1500000,
        variation: { percentageChange: 12.5, absoluteChange: 50000 },
        activity: "5/10",
        activityPercentage: 50,
        delegators: 25,
        avgVoteTiming: { text: "Early (3d avg)", percentage: 40 },
      },
    ];
    const result = formatCsvData(data);

    expect(result[0].address).toBe("0xdelegate1");
    expect(result[0].votingPower).toBe("1500000");
    expect(result[0].variation_percentageChange).toBe("12.5");
    expect(result[0].variation_absoluteChange).toBe("50000");
    expect(result[0].activity).toBe("5/10");
    expect(result[0].activityPercentage).toBe("50");
    expect(result[0].delegators).toBe("25");
    expect(result[0].avgVoteTiming).toBe("Early (3d avg)");
  });

  test("simulates token holder table data for CSV export", () => {
    const data = [
      {
        address: "0xholder1",
        balance: 123456.789,
        variation: { percentageChange: -3.5, absoluteChange: -500 },
        delegate: "0xdelegate1",
      },
    ];
    const result = formatCsvData(data);

    expect(result[0].address).toBe("0xholder1");
    expect(result[0].balance).toBe("123456.789");
    expect(result[0].variation_percentageChange).toBe("-3.5");
    expect(result[0].variation_absoluteChange).toBe("-500");
    expect(result[0].delegate).toBe("0xdelegate1");
  });
});
