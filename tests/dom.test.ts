import { describe, it, expect, vi } from "vitest";
import { waitFor, findByText, simulateClick } from "../src/dom";

describe("findByText", () => {
  it("finds element matching selector and containing text", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <label><span>ヘイト</span></label>
      <label><span>スパム</span></label>`;
    const hit = findByText(root, "label", "スパム");
    expect(hit).not.toBeNull();
    expect(hit!.textContent!.trim()).toBe("スパム");
  });

  it("returns null when nothing matches", () => {
    const root = document.createElement("div");
    root.innerHTML = `<label>foo</label>`;
    expect(findByText(root, "label", "スパム")).toBeNull();
  });
});

describe("simulateClick", () => {
  it("dispatches a click event", () => {
    const el = document.createElement("button");
    const onClick = vi.fn();
    el.addEventListener("click", onClick);
    simulateClick(el);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("waitFor", () => {
  it("resolves once fn returns truthy", async () => {
    let flag: HTMLElement | null = null;
    setTimeout(() => {
      flag = document.createElement("div");
    }, 30);
    const el = await waitFor(() => flag, { timeout: 1000, interval: 10 });
    expect(el).not.toBeNull();
  });

  it("rejects on timeout", async () => {
    await expect(
      waitFor(() => null, { timeout: 50, interval: 10 }),
    ).rejects.toThrow(/timeout/);
  });
});
