import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

describe("formatDuration", () => {
  it("pads seconds to two digits", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(18)).toBe("0:18");
  });

  it("rolls seconds over into minutes", () => {
    expect(formatDuration(64)).toBe("1:04");
    expect(formatDuration(600)).toBe("10:00");
  });
});