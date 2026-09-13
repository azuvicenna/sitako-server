import { resolveParam } from "@/utils/core/param";

describe("resolveParam", () => {
  it("should return empty string when param is undefined or empty", () => {
    expect(resolveParam(undefined)).toBe("");
    expect(resolveParam("")).toBe("");
  });

  it("should return trimmed string when given a single string", () => {
    expect(resolveParam("user123")).toBe("user123");
    expect(resolveParam("  user123  ")).toBe("user123");
  });

  it("should return the first element trimmed when given an array of strings", () => {
    expect(resolveParam(["user123", "admin"])).toBe("user123");
    expect(resolveParam(["  user123  ", "admin"])).toBe("user123");
  });
});
