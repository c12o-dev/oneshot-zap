// 各ポストのアクションバーに🚫ボタンを差し込む。
// 二重注入を避けるため冪等にする(happy-dom で単体テスト)。

export const BTN_CLASS = "oneshot-zap-btn";
const MARK_ATTR = "data-oneshot-zap";

// 稲妻アウトライン(Lucide zap 相当)。stroke=currentColor で X 純正グレーに馴染ませ、
// ホバーで赤に変える(色は content.css)。
const ZAP_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';

export interface InjectResult {
  button: HTMLButtonElement;
  created: boolean; // 新規作成なら true、既存ならボタンを返しつつ false
}

/**
 * article のアクショングループ([role="group"])末尾に🚫ボタンを足す。
 * 既に足してあれば作らず既存を返す。グループが無ければ null。
 */
export function injectButton(
  article: HTMLElement,
  onZap: (article: HTMLElement) => void,
): InjectResult | null {
  const existing = article.querySelector<HTMLButtonElement>("." + BTN_CLASS);
  if (existing) return { button: existing, created: false };

  // 下部アクションバー(返信/RT/いいね/ブックマーク/共有)。複数あれば最後を使う。
  const groups = article.querySelectorAll<HTMLElement>('[role="group"]');
  const group = groups.length ? groups[groups.length - 1] : null;
  if (!group) return null;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = BTN_CLASS;
  btn.setAttribute("aria-label", "スパム報告してブロック");
  btn.title = "スパム報告 → ブロック";
  btn.innerHTML = ZAP_SVG;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onZap(article);
  });

  article.setAttribute(MARK_ATTR, "1");
  group.appendChild(btn);
  return { button: btn, created: true };
}
