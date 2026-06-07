// 拡張の設定。chrome.storage.sync に永続化し、未設定キーは DEFAULTS で補完する。
// content script(確認するか判定)と options ページ(設定変更)の両方から使う。

export interface Settings {
  /** 実行前に確認モーダルを出すか。破壊的・取り消し不可なので既定は true。 */
  confirmBeforeZap: boolean;
}

export const DEFAULTS: Settings = {
  confirmBeforeZap: true,
};

/** 保存値(部分/欠落)に既定値をかぶせて完全な Settings にする。純粋関数なのでテスト対象。 */
export function mergeSettings(
  stored: Partial<Settings> | null | undefined,
): Settings {
  return { ...DEFAULTS, ...(stored ?? {}) };
}

export async function getSettings(): Promise<Settings> {
  const stored = (await chrome.storage.sync.get(null)) as Partial<Settings>;
  return mergeSettings(stored);
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch);
}
