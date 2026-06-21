import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseJsonStrict, parseJsonWithSchema, stripJsonFences } from "./json";

describe("Gemini JSON helpers", () => {
  it("strips markdown JSON fences", () => {
    expect(stripJsonFences("```json\n{\"name\":\"Acme\"}\n```")).toBe("{\"name\":\"Acme\"}");
  });

  it("strips embedded markdown JSON fences after model preamble", () => {
    expect(stripJsonFences("Here is the JSON:\n```json\n{\"name\":\"Acme\"}\n```")).toBe("{\"name\":\"Acme\"}");
  });

  it("extracts raw JSON embedded in model prose without fences", () => {
    expect(stripJsonFences("Here is the result:\n{\"name\":\"Acme\",\"ok\":true}\nDone.")).toBe("{\"name\":\"Acme\",\"ok\":true}");
  });

  it("parses plain JSON into a typed success result", () => {
    const result = parseJsonStrict<{ name: string }>("{\"name\":\"Acme\"}");

    expect(result).toEqual({
      ok: true,
      data: {
        name: "Acme"
      }
    });
  });

  it("returns a controlled failure for malformed JSON", () => {
    const result = parseJsonStrict("{bad json");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_json");
      expect(result.error.message).toMatch(/valid JSON/i);
    }
  });

  it("validates parsed JSON with a zod schema", () => {
    const schema = z.object({
      competitors: z.array(z.string()).min(1)
    });

    expect(parseJsonWithSchema("{\"competitors\":[\"Northstar\"]}", schema)).toEqual({
      ok: true,
      data: {
        competitors: ["Northstar"]
      }
    });

    const invalid = parseJsonWithSchema("{\"competitors\":[]}", schema);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.code).toBe("schema_validation_failed");
    }
  });
});
