// 実行結果の簡易トースト。確認ダイアログ無しで即発火する設計のため、
// 「誰に何をしたか」を必ず可視化して誤爆に気づけるようにする。

type Kind = "info" | "ok" | "err";

const COLORS: Record<Kind, string> = {
  info: "#1d9bf0",
  ok: "#00ba7c",
  err: "#f4212e",
};

export function toast(message: string, kind: Kind = "info", ms = 3500): void {
  const el = document.createElement("div");
  el.className = "oneshot-zap-toast";
  el.textContent = message;
  el.style.borderLeft = `4px solid ${COLORS[kind]}`;
  document.body.appendChild(el);
  // 入場
  requestAnimationFrame(() => el.classList.add("oneshot-zap-toast--in"));
  setTimeout(() => {
    el.classList.remove("oneshot-zap-toast--in");
    setTimeout(() => el.remove(), 300);
  }, ms);
}
