import { describe, it, expect } from "vitest";
import { SuffixTargetValidator } from "../src/utils/validator";
import { IConfig } from "../src/config";

describe("SuffixTargetValidator", () => {
  const mockConfig: IConfig = {
    allowedTargetHostSuffix: ".run.app",
  } as any;

  const validator = new SuffixTargetValidator(mockConfig);

  it("should return true for valid targets matching suffix", () => {
    expect(validator.isValid("https://project-123.run.app")).toBe(true);
    expect(validator.isValid("https://foo-bar.run.app/some/path")).toBe(true);
  });

  it("should return false for targets not matching suffix", () => {
    expect(validator.isValid("https://evil.com")).toBe(false);
    expect(validator.isValid("https://run.app.evil.com")).toBe(false);
  });

  it("should return false for invalid URLs or non-https", () => {
    expect(validator.isValid("http://project-123.run.app")).toBe(false);
    expect(validator.isValid("invalid-url")).toBe(false);
  });
});
