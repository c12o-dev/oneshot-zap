// ツイート要素から @スクリーンネーム を取り出す。
// 報告/ブロックの対象を確定するために使う(純粋関数なので単体テスト対象)。

const RESERVED = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "search",
  "settings",
  "i",
  "compose",
  "hashtag",
]);

/** /handle の pathname から先頭セグメント(=スクリーンネーム)を取り出す。 */
function handleFromHref(href: string): string | null {
  let path: string;
  try {
    // 相対(live X)・絶対(保存HTML)どちらでも pathname を取れる
    path = new URL(href, "https://x.com").pathname;
  } catch {
    return null;
  }
  const segs = path.split("/").filter(Boolean);
  if (segs.length !== 1) return null; // /handle のみ。/handle/status/... は除外
  const handle = segs[0];
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  if (RESERVED.has(handle.toLowerCase())) return null;
  return handle;
}

/**
 * article(=1ポスト)から投稿者のスクリーンネームを返す。取れなければ null。
 * User-Name ブロック内の「/handle」リンクを最優先で見る。
 */
export function getScreenName(article: Element): string | null {
  const nameBlock = article.querySelector('[data-testid="User-Name"]');
  const scopes: ParentNode[] = nameBlock ? [nameBlock, article] : [article];
  for (const scope of scopes) {
    const anchors = Array.from(
      scope.querySelectorAll<HTMLAnchorElement>('a[href]'),
    );
    for (const a of anchors) {
      const h = handleFromHref(a.getAttribute("href") ?? "");
      if (h) return h;
    }
  }
  return null;
}
