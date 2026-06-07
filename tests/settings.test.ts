import { describe, it, expect } from "vitest";
import { mergeSettings, DEFAULTS } from "../src/settings";

describe("mergeSettings", () => {
  it("falls back to defaults when nothing is stored", () => {
    expect(mergeSettings(undefined)).toEqual(DEFAULTS);
    expect(mergeSettings(null)).toEqual(DEFAULTS);
    expect(mergeSettings({})).toEqual(DEFAULTS);
  });

  it("defaults confirmBeforeZap to true (destructive action is opt-out, not opt-in)", () => {
    expect(DEFAULTS.confirmBeforeZap).toBe(true);
  });

  it("stored value overrides the default", () => {
    expect(mergeSettings({ confirmBeforeZap: false })).toEqual({
      confirmBeforeZap: false,
    });
  });
});
