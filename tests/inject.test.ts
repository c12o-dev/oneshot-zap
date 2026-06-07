import { describe, it, expect, vi } from "vitest";
import { injectButton, BTN_CLASS } from "../src/inject";

function tweetWithGroup(): HTMLElement {
  const a = document.createElement("article");
  a.setAttribute("data-testid", "tweet");
  a.innerHTML = `<div role="group" aria-label="アクション">
    <button data-testid="reply"></button>
    <button data-testid="bookmark"></button>
  </div>`;
  return a;
}

describe("injectButton", () => {
  it("creates a 🚫 button in the action group", () => {
    const a = tweetWithGroup();
    const res = injectButton(a, () => {});
    expect(res).not.toBeNull();
    expect(res!.created).toBe(true);
    const btn = a.querySelector("." + BTN_CLASS);
    expect(btn).not.toBeNull();
    expect(btn!.parentElement!.getAttribute("role")).toBe("group");
    // 稲妻 SVG が描画されている
    expect(btn!.querySelector("svg")).not.toBeNull();
    expect(btn!.querySelector("polygon")).not.toBeNull();
  });

  it("is idempotent — does not duplicate on second call", () => {
    const a = tweetWithGroup();
    injectButton(a, () => {});
    const res2 = injectButton(a, () => {});
    expect(res2!.created).toBe(false);
    expect(a.querySelectorAll("." + BTN_CLASS).length).toBe(1);
  });

  it("invokes onZap with the article when clicked", () => {
    const a = tweetWithGroup();
    const onZap = vi.fn();
    const res = injectButton(a, onZap);
    res!.button.click();
    expect(onZap).toHaveBeenCalledOnce();
    expect(onZap).toHaveBeenCalledWith(a);
  });

  it("returns null when no action group exists", () => {
    const a = document.createElement("article");
    expect(injectButton(a, () => {})).toBeNull();
  });
});
