// 実行前の確認モーダル。確認なし即実行は誤爆が痛いので、設定 ON 時にこれを挟む。
// toast と同じダークテーマ(実行=赤 / やめる=地味)。Promise<boolean> を返す(実行=true)。
// happy-dom で単体テストする。

const MODAL = "oneshot-zap-modal";

/**
 * @handle を対象にした「報告→ブロック」の確認モーダルを表示する。
 * 実行=true / やめる・Escape・背景クリック=false で resolve する。
 */
export function confirmZap(handle: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = MODAL + "-overlay";

    const box = document.createElement("div");
    box.className = MODAL;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "スパム報告してブロックの確認");

    const title = document.createElement("div");
    title.className = MODAL + "-title";
    title.textContent = "⚡ スパム報告 → ブロック";

    const body = document.createElement("div");
    body.className = MODAL + "-body";
    // ハンドルは textContent で入れる(任意文字列なので innerHTML にしない)。
    body.textContent = `@${handle} を報告してブロックします。この操作は取り消せません。`;

    const actions = document.createElement("div");
    actions.className = MODAL + "-actions";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = MODAL + "-cancel";
    cancel.textContent = "やめる";

    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = MODAL + "-confirm";
    ok.textContent = "実行する";

    actions.append(cancel, ok);
    box.append(title, body, actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let done = false;
    function close(result: boolean): void {
      if (done) return;
      done = true;
      document.removeEventListener("keydown", onKey, true);
      overlay.remove();
      resolve(result);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    }

    cancel.addEventListener("click", () => close(false));
    ok.addEventListener("click", () => close(true));
    // 背景(オーバーレイ自身)クリックはキャンセル。
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
    document.addEventListener("keydown", onKey, true);

    // 既定フォーカスは安全側(やめる)。Enter 連打での誤実行を防ぐ。
    cancel.focus();
  });
}
