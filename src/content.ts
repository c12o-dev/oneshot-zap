// エントリ。タイムライン/リプライ欄の各ポストに🚫ボタンを注入し、
// クリックで スパム報告→ブロック を実行する。

import { injectButton } from "./inject";
import { getScreenName } from "./extract";
import { reportSpamAndBlock } from "./flow";
import { toast } from "./toast";
import { getSettings } from "./settings";
import { confirmZap } from "./confirm";

const TWEET_SELECTOR = 'article[data-testid="tweet"]';
let busy = false;

async function onZap(article: HTMLElement): Promise<void> {
  if (busy) {
    toast("別のポストを処理中です。少し待ってください", "info", 2000);
    return;
  }
  const handle = getScreenName(article);
  if (!handle) {
    toast("アカウントを特定できませんでした", "err");
    return;
  }
  // 確認〜実行を1つの critical section にする(確認中の二重起動も busy で弾く)。
  busy = true;
  document.body.classList.add("oneshot-zap-busy");
  try {
    const { confirmBeforeZap } = await getSettings();
    if (confirmBeforeZap && !(await confirmZap(handle))) {
      return; // ユーザーがキャンセル。finally で busy 解除。
    }
    toast(`@${handle} を報告→ブロック中…`, "info", 6000);
    await reportSpamAndBlock(article, handle);
    toast(`@${handle} をスパム報告してブロックしました`, "ok");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    toast(msg, "err", 6000);
  } finally {
    busy = false;
    document.body.classList.remove("oneshot-zap-busy");
  }
}

function scan(): void {
  const tweets = document.querySelectorAll<HTMLElement>(TWEET_SELECTOR);
  tweets.forEach((t) => injectButton(t, onZap));
}

let raf = 0;
function scheduleScan(): void {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    scan();
  });
}

const observer = new MutationObserver(scheduleScan);
observer.observe(document.body, { childList: true, subtree: true });
scan();
