import { serializeJsonLd } from "@/shared/seo/JsonLd";

describe("serializeJsonLd", () => {
  test("escapes characters that can break out of JSON-LD script tags", () => {
    const result = serializeJsonLd({
      text: '</script><script>alert("xss")</script>&',
    });

    expect(result).toContain("\\u003c/script\\u003e");
    expect(result).toContain("\\u003cscript\\u003e");
    expect(result).toContain("\\u0026");
    expect(result).not.toContain("</script>");
  });

  test("escapes unicode line separators", () => {
    const result = serializeJsonLd({
      text: "line\u2028separator\u2029paragraph",
    });

    expect(result).toContain("\\u2028");
    expect(result).toContain("\\u2029");
  });
});
