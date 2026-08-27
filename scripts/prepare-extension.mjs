import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const outDir = join(root, "extension");
const outDistDir = join(outDir, "dist");
const outIconsDir = join(outDir, "assets", "icons");

const pkg = JSON.parse(
  await readFile(join(root, "package.json"), "utf8"),
);

const manifest = {
  manifest_version: 3,
  name: "BetterTwitchControls",
  version: String(pkg.version || "1.0.0"),
  description: "Keyboard shortcuts for Twitch chat/player focus and controls.",
  homepage_url: "https://github.com/Chulii/BetterTwitchControls",
  browser_specific_settings: {
    gecko: {
      id: "better-twitch-controls@socialites.github.io",
      data_collection_permissions: {
        required: ["none"],
      },
    },
  },
  icons: {
    16: "assets/icons/icon16.png",
    48: "assets/icons/icon48.png",
    128: "assets/icons/icon128.png",
  },
  action: {
    default_title: "BetterTwitchControls",
    default_popup: "popup.html",
  },
  content_scripts: [
    {
      matches: ["*://*.twitch.tv/*", "*://twitch.tv/*"],
      js: ["dist/index.js"],
      run_at: "document_idle",
    },
  ],
};

await mkdir(outDistDir, { recursive: true });
await mkdir(outIconsDir, { recursive: true });
await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
await copyFile(join(root, "dist", "index.js"), join(outDistDir, "index.js"));
await copyFile(join(root, "CONTROLS.md"), join(outDir, "CONTROLS.md"));
await copyFile(join(root, "popup.html"), join(outDir, "popup.html"));
await copyFile(join(root, "popup.css"), join(outDir, "popup.css"));
await copyFile(join(root, "popup.js"), join(outDir, "popup.js"));
await copyFile(join(root, "assets", "icons", "icon16.png"), join(outIconsDir, "icon16.png"));
await copyFile(join(root, "assets", "icons", "icon48.png"), join(outIconsDir, "icon48.png"));
await copyFile(join(root, "assets", "icons", "icon128.png"), join(outIconsDir, "icon128.png"));

console.log("Prepared extension/ (load this folder via chrome://extensions → Load unpacked)");
