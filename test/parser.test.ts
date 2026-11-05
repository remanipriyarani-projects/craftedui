import { describe, expect, it } from "vitest";
import { parse } from "../src/index.js";
import { parseExpression } from "../src/parser.js";

const baseDate = new Date("2024-01-15T10:20:30.000Z");

describe("parse", () => {
  it("evaluates the specification examples from an injected UTC base date", () => {
    expect(parse("now()+1d", baseDate).toISOString()).toBe("2024-01-16T10:20:30.000Z");
    expect(parse("now()+8d", baseDate).toISOString()).toBe("2024-01-23T10:20:30.000Z");
    expect(parse("now()+10d+12h", baseDate).toISOString()).toBe("2024-01-25T22:20:30.000Z");
    expect(parse("now()-2d+12h", baseDate).toISOString()).toBe("2024-01-13T22:20:30.000Z");
    expect(parse("now()+1y-2mon+5d-10h", baseDate).toISOString()).toBe(
      "2024-11-20T00:20:30.000Z",
    );
  });

  it("supports multiple positive and negative operations in sequence", () => {
    expect(parse("now()+1d-1d+2h-30m", baseDate).toISOString()).toBe(
      "2024-01-15T11:50:30.000Z",
    );
  });

  it("supports seconds, minutes, and hours", () => {
    expect(parse("now()+45s+20m+3h", baseDate).toISOString()).toBe(
      "2024-01-15T13:41:15.000Z",
    );
    expect(parse("now()-30s-10m-1h", baseDate).toISOString()).toBe(
      "2024-01-15T09:10:00.000Z",
    );
  });

  it("supports days, months, and years using UTC calendar arithmetic", () => {
    expect(parse("now()+1d", new Date("2024-02-28T00:00:00.000Z")).toISOString()).toBe(
      "2024-02-29T00:00:00.000Z",
    );
    expect(parse("now()+1mon", new Date("2024-01-31T12:00:00.000Z")).toISOString()).toBe(
      "2024-02-29T12:00:00.000Z",
    );
    expect(parse("now()+1y", new Date("2024-02-29T12:00:00.000Z")).toISOString()).toBe(
      "2025-02-28T12:00:00.000Z",
    );
    expect(parse("now()-1mon", new Date("2024-03-31T12:00:00.000Z")).toISOString()).toBe(
      "2024-02-29T12:00:00.000Z",
    );
  });

  it("uses the current time when a base date is not provided", () => {
    const before = Date.now();
    const result = parse("now()");
    const after = Date.now();

    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it("does not mutate the injected base date", () => {
    const original = new Date(baseDate);
    parse("now()+1y+2mon+3d", baseDate);
    expect(baseDate).toEqual(original);
  });

  it("rejects an invalid base date", () => {
    expect(() => parse("now()+1d", new Date(Number.NaN))).toThrow("Base date must be a valid Date.");
  });
});

describe("parseExpression", () => {
  it.each(["", " ", "tomorrow", "now", "now()+1dxyz", "now()+1", "now()++1d", "now()+1d "])(
    "rejects invalid expression %j",
    (expression) => {
      expect(() => parseExpression(expression)).toThrow();
    },
  );

  it("reports an unsupported unit", () => {
    expect(() => parseExpression("now()+1w")).toThrow('Unsupported time unit "w".');
  });

  it("rejects amounts outside the safe integer range", () => {
    expect(() => parseExpression("now()+9007199254740992d")).toThrow(RangeError);
  });

  it("returns a typed sequence without evaluating it", () => {
    expect(parseExpression("now()-2d+12h")).toEqual({
      modifiers: [
        { operation: "subtract", amount: 2, unit: "d" },
        { operation: "add", amount: 12, unit: "h" },
      ],
    });
  });
});
