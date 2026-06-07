// dist/ を「そのまま読み込める拡張ルート」として組み立てる。
// 出力物: dist/{manifest.json, content.js, content.css, options.html, options.js, icons/*}
// → Chrome には dist/ を、配布時は dist/ を zip する(src/node_modules を含めない)。
import { build } from "esbuild";
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
mkdirSync(resolve(dist, "icons"), { recursive: true });

// 1. content script と options ページをバンドル(共に src/ 直下なので dist/ 直下に出る)
await build({
  entryPoints: [resolve(root, "src/content.ts"), resolve(root, "src/options.ts")],
  outdir: dist,
  bundle: true,
  format: "iife",
  target: ["chrome114"],
  platform: "browser",
  legalComments: "none",
});

// 2. CSS・manifest・options.html をコピー
copyFileSync(resolve(root, "src/content.css"), resolve(dist, "content.css"));
copyFileSync(resolve(root, "src/options.html"), resolve(dist, "options.html"));
copyFileSync(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));

// 3. アイコンをコピー(無ければ gen-icons を先に)
const icons = ["icon16.png", "icon48.png", "icon128.png"];
const missing = icons.filter((f) => !existsSync(resolve(root, "icons", f)));
if (missing.length) {
  throw new Error(
    `アイコンが無い: ${missing.join(", ")} — 先に \`pnpm icons\` を実行してください`,
  );
}
for (const f of icons) {
  copyFileSync(resolve(root, "icons", f), resolve(dist, "icons", f));
}

console.log("built dist/ (manifest + content.js + content.css + options.html + options.js + icons) — Chrome にはこの dist/ を読み込む");
