// スパム報告→ブロック を UI 自動操作で実行する。
//
// 【なぜ UI 自動操作か】
// X のスパム報告は flow token を伴うステートフルな多段フローで、replay 可能な
// 公開/内部 API が存在しない(現役 OSS の mass-block-twitter ですら報告は API 化
// しておらず block だけ API 化している)。よって「報告 UI を正しく駆動する」のが
// 現状で最も robust かつ唯一現実的な自動化手段。ここはその駆動ロジック。
//
// スパムはファストトラックで中間ステップが無い(スパム選択→次へ→送信完了→ブロック)。
// 捕獲した実DOM(idea/tmp/twitter)に基づくセレクタ:
//   … メニュー        : article 内 [data-testid="caret"]
//   ポストを報告      : [data-testid="report"] (role=menuitem)
//   スパム ラジオ      : dialog 内 label でテキスト "スパム"
//   次へ              : [data-testid="ChoiceSelectionNextButton"]
//   送信後のブロック  : dialog 内 button でテキスト "さんをブロック"
//   完了/閉じる        : "完了" / [data-testid="app-bar-close"]

import { waitFor, findByText, simulateClick } from "./dom";

const STEP_TIMEOUT = 8000;

function openMenu(article: HTMLElement): void {
  const caret = article.querySelector<HTMLElement>('[data-testid="caret"]');
  if (!caret) throw new Error("…メニューが見つからない (caret)");
  simulateClick(caret);
}

async function clickReportMenuItem(): Promise<void> {
  const item = await waitFor(
    () => document.querySelector<HTMLElement>('[data-testid="report"]'),
    { timeout: STEP_TIMEOUT },
  );
  simulateClick(item);
}

function currentDialog(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
  return dialogs.length ? dialogs[dialogs.length - 1] : null;
}

async function selectSpam(): Promise<void> {
  const label = await waitFor(() => {
    const dlg = currentDialog();
    return dlg ? findByText(dlg, "label", "スパム") : null;
  }, { timeout: STEP_TIMEOUT });
  const input = label.querySelector<HTMLElement>('input[type="radio"]');
  simulateClick(input ?? label);
}

async function clickNext(): Promise<void> {
  const btn = await waitFor(() => {
    const b = document.querySelector<HTMLButtonElement>(
      '[data-testid="ChoiceSelectionNextButton"]',
    );
    return b && !b.disabled ? b : null;
  }, { timeout: STEP_TIMEOUT });
  simulateClick(btn);
}

async function clickBlockOnSuccess(handle: string): Promise<void> {
  const btn = await waitFor(() => {
    const dlg = currentDialog();
    if (!dlg) return null;
    return (
      findByText(dlg, "button", "さんをブロック") ??
      findByText(dlg, "button", handle) ??
      findByText(dlg, "button", "ブロック")
    );
  }, { timeout: 12000 });
  simulateClick(btn);
}

async function closeDialog(): Promise<void> {
  // ブロックはクリック時点で確定済み。残った完了画面を閉じるだけ。
  const dlg = currentDialog();
  const done =
    (dlg && findByText(dlg, "button", "完了")) ||
    document.querySelector<HTMLElement>('[data-testid="app-bar-close"]');
  if (done) {
    simulateClick(done);
    return;
  }
  document.body.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
}

/**
 * article(=1ポスト) を対象に スパム報告→ブロック を実行。
 * handle は表示用。失敗時はどのステップで落ちたかを含む Error を投げる。
 */
export async function reportSpamAndBlock(
  article: HTMLElement,
  handle: string,
): Promise<void> {
  try {
    openMenu(article);
    await clickReportMenuItem();
    await selectSpam();
    await clickNext();
    await clickBlockOnSuccess(handle);
    await closeDialog();
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`@${handle} の処理に失敗: ${reason}`);
  }
}
