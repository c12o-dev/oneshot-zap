// 純粋寄りの DOM ヘルパー。X の SPA は要素が非同期に出入りするので、
// 「出るまで待つ」「テキストで探す」「本物っぽいクリックを送る」が要る。
// ここは happy-dom で単体テストする。

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface WaitOpts {
  timeout?: number; // ms
  interval?: number; // ms
}

/**
 * fn が truthy を返すまでポーリングする。timeout 超過で reject。
 * X のモーダルは段階的に描画されるので、各ステップでこれを使う。
 */
export async function waitFor<T>(
  fn: () => T | null | undefined | false,
  opts: WaitOpts = {},
): Promise<T> {
  const timeout = opts.timeout ?? 8000;
  const interval = opts.interval ?? 35;
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start >= timeout) {
      throw new Error("waitFor: timeout");
    }
    await sleep(interval);
  }
}

/** root 内で selector に一致し、textContent に text を含む最初の要素を返す。 */
export function findByText(
  root: ParentNode,
  selector: string,
  text: string,
): HTMLElement | null {
  const needle = text.trim();
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  for (const el of nodes) {
    if ((el.textContent ?? "").trim().includes(needle)) return el;
  }
  return null;
}

/**
 * 本物のクリックに近いイベント列を送る。
 * X の一部 UI は単なる .click() を無視し pointer/mouse 列を見るため。
 */
export function simulateClick(el: Element): void {
  const opts = { bubbles: true, cancelable: true, view: window };
  // happy-dom など PointerEvent 非対応環境では MouseEvent で代替する。
  const Pointer: typeof MouseEvent =
    typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
  el.dispatchEvent(new Pointer("pointerdown", opts));
  el.dispatchEvent(new MouseEvent("mousedown", opts));
  el.dispatchEvent(new Pointer("pointerup", opts));
  el.dispatchEvent(new MouseEvent("mouseup", opts));
  el.dispatchEvent(new MouseEvent("click", opts));
}
