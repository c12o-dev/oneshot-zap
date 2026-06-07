import { describe, it, expect, beforeEach } from "vitest";
import { confirmZap } from "../src/confirm";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("confirmZap", () => {
  it("renders the target handle in the modal body", () => {
    confirmZap("btc_urutaro");
    const body = document.querySelector(".oneshot-zap-modal-body");
    expect(body?.textContent).toContain("@btc_urutaro");
  });

  it("resolves true when 実行する is clicked", async () => {
    const p = confirmZap("foo");
    document
      .querySelector<HTMLButtonElement>(".oneshot-zap-modal-confirm")!
      .click();
    expect(await p).toBe(true);
  });

  it("resolves false when やめる is clicked", async () => {
    const p = confirmZap("foo");
    document
      .querySelector<HTMLButtonElement>(".oneshot-zap-modal-cancel")!
      .click();
    expect(await p).toBe(false);
  });

  it("resolves false on Escape", async () => {
    const p = confirmZap("foo");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(await p).toBe(false);
  });

  it("removes the modal from the DOM after a choice", async () => {
    const p = confirmZap("foo");
    document
      .querySelector<HTMLButtonElement>(".oneshot-zap-modal-confirm")!
      .click();
    await p;
    expect(document.querySelector(".oneshot-zap-modal-overlay")).toBeNull();
  });
});
