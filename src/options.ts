// オプションページのロジック。設定を読み込み、変更を chrome.storage に保存する。
import { getSettings, setSettings } from "./settings";

const checkbox = document.getElementById("confirmBeforeZap") as HTMLInputElement;
const status = document.getElementById("status") as HTMLElement;

async function load(): Promise<void> {
  const s = await getSettings();
  checkbox.checked = s.confirmBeforeZap;
}

checkbox.addEventListener("change", async () => {
  await setSettings({ confirmBeforeZap: checkbox.checked });
  status.textContent = "保存しました";
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
});

void load();
