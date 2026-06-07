import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { reportSpamAndBlock } from "../src/flow";

// X の報告フローを模した偽 DOM。クリックに応じて次の段の要素を生やすことで、
// flow.ts のステップ列(caret→report→スパム→次へ→ブロック→完了)を実際に駆動する。
// これが通れば「flow.ts の各セレクタと順序が内部整合している」ことを保証できる。
function installFakeX() {
  const state = { blocked: false, completed: false };

  function handler(e: Event): void {
    const t = e.target as HTMLElement | null;
    if (!t?.closest) return;

    // … メニュー → 「ポストを報告」項目を出す
    if (t.closest('[data-testid="caret"]')) {
      if (!document.querySelector('[data-testid="report"]')) {
        const menu = document.createElement("div");
        menu.setAttribute("role", "menu");
        menu.innerHTML =
          '<div role="menuitem" data-testid="report">ポストを報告</div>';
        document.body.appendChild(menu);
      }
      return;
    }

    // 「ポストを報告」 → 報告ダイアログ(スパム ラジオ＋無効な「次へ」)
    if (t.closest('[data-testid="report"]')) {
      document.querySelector('[role="menu"]')?.remove();
      const dlg = document.createElement("div");
      dlg.setAttribute("role", "dialog");
      dlg.innerHTML =
        '<label><input type="radio" /><span>スパム</span></label>' +
        '<button data-testid="ChoiceSelectionNextButton" disabled>次へ</button>';
      document.body.appendChild(dlg);
      return;
    }

    // スパム選択 → 「次へ」を有効化
    const label = t.closest("label");
    if (label && (label.textContent ?? "").includes("スパム")) {
      const next = document.querySelector<HTMLButtonElement>(
        '[data-testid="ChoiceSelectionNextButton"]',
      );
      if (next) next.disabled = false;
      return;
    }

    // 「次へ」 → 送信完了ダイアログ(「〜さんをブロック」ボタン)
    const next = t.closest<HTMLButtonElement>(
      '[data-testid="ChoiceSelectionNextButton"]',
    );
    if (next) {
      if (next.disabled) return;
      document.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
      const dlg = document.createElement("div");
      dlg.setAttribute("role", "dialog");
      dlg.innerHTML = "<button>@foo さんをブロック</button>";
      document.body.appendChild(dlg);
      return;
    }

    const btn = t.closest("button");
    if (btn) {
      const txt = (btn.textContent ?? "").trim();
      // 「ブロック」 → 完了ダイアログ
      if (txt.includes("さんをブロック")) {
        state.blocked = true;
        document.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
        const dlg = document.createElement("div");
        dlg.setAttribute("role", "dialog");
        dlg.innerHTML = "<button>完了</button>";
        document.body.appendChild(dlg);
        return;
      }
      // 「完了」 → 閉じる
      if (txt === "完了") {
        state.completed = true;
        document.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
        return;
      }
    }
  }

  document.addEventListener("click", handler);
  return { state, cleanup: () => document.removeEventListener("click", handler) };
}

function tweetWithCaret(): HTMLElement {
  const a = document.createElement("article");
  a.setAttribute("data-testid", "tweet");
  a.innerHTML = '<div role="group"><button data-testid="caret"></button></div>';
  document.body.appendChild(a);
  return a;
}

let active: { cleanup: () => void } | null = null;
beforeEach(() => {
  document.body.innerHTML = "";
});
afterEach(() => {
  active?.cleanup();
  active = null;
});

describe("reportSpamAndBlock", () => {
  it("drives the full caret→report→spam→next→block→done sequence and resolves", async () => {
    const x = installFakeX();
    active = x;
    const article = tweetWithCaret();

    await reportSpamAndBlock(article, "foo");

    expect(x.state.blocked).toBe(true);
    expect(x.state.completed).toBe(true);
  });

  it("wraps a step failure with the handle and the failing step (for the toast)", async () => {
    // caret 不在で openMenu が即失敗 → toast に出る形 "@foo の処理に失敗: …(caret)" になる。
    const article = document.createElement("article");
    article.setAttribute("data-testid", "tweet");
    document.body.appendChild(article);

    await expect(reportSpamAndBlock(article, "foo")).rejects.toThrow(
      /@foo の処理に失敗:.*caret/,
    );
  });
});
