import { describe, it, expect } from "vitest";
import { getScreenName } from "../src/extract";

function tweet(html: string): HTMLElement {
  const el = document.createElement("article");
  el.setAttribute("data-testid", "tweet");
  el.innerHTML = html;
  return el;
}

describe("getScreenName", () => {
  it("relative href in User-Name (live X)", () => {
    const a = tweet(`
      <div data-testid="User-Name">
        <a href="/btc_urutaro" role="link"><span>びっとこ売る太郎</span></a>
        <a href="/btc_urutaro" role="link"><span>@btc_urutaro</span></a>
      </div>`);
    expect(getScreenName(a)).toBe("btc_urutaro");
  });

  it("absolute href (saved HTML form)", () => {
    const a = tweet(`
      <div data-testid="User-Name">
        <a href="https://x.com/btc_urutaro" role="link"><span>@btc_urutaro</span></a>
      </div>`);
    expect(getScreenName(a)).toBe("btc_urutaro");
  });

  it("ignores /handle/status/... and reserved paths", () => {
    const a = tweet(`
      <div data-testid="User-Name">
        <a href="/home" role="link">home</a>
        <a href="/btc_urutaro/status/123" role="link">time</a>
        <a href="/realuser" role="link"><span>@realuser</span></a>
      </div>`);
    expect(getScreenName(a)).toBe("realuser");
  });

  it("returns null when no handle link exists", () => {
    const a = tweet(`<div data-testid="User-Name"><span>名無し</span></div>`);
    expect(getScreenName(a)).toBeNull();
  });
});
