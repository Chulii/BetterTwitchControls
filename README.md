### BetterTwitchControls

<img src="assets/icons/icon128.png" alt="BetterTwitchControls icon" width="72" height="72" />

### Controls

<!-- CONTROLS:START -->


### BetterTwitchControls — Controls

### Implemented

- **`1`–`9`**: Open the corresponding visible stream in the Twitch sidebar.
- **`Shift` + `1`–`9`**: Open the corresponding visible sidebar stream in a new tab.
- **`?`**: Show or hide the in-page shortcut guide.

- **`c`**: Focus the chat input (only when you are *not* already typing in an input/textarea/contenteditable).
- **`Esc` (while chat is focused)**: Leave chat focus and focus the player controls (so player hotkeys work again).
- **`t` (while player controls are focused)**: Toggle Theatre Mode (clicks the Twitch theatre-mode button that’s labeled with `(alt+t)`).
- **`l` (while player controls are focused)**: Skip to Live (activates the “LIVE” control that appears after rewinding).
- **`ArrowUp` / `ArrowDown` (while player controls are focused)**: Volume up/down (focuses the volume slider if needed, then increments/decrements it).

- **Focus**
  - **Focus chat from outside chat**: `c` (**implemented**)
  - **Focus player from inside chat**: `Esc` (**implemented**)
- **Playback / Player**
  - **Play/Pause**: `k` or `Space` (Twitch built-in; should work once player is focused)
  - **Exit Theatre Mode**: `Esc` (Twitch built-in; should work once player is focused)
  - **Volume up/down**: `ArrowUp` / `ArrowDown` (custom; focuses + adjusts the volume slider, **implemented**)
  - **Seek**: `ArrowLeft` / `ArrowRight` (Twitch built-in; should work once player is focused)
- **Theatre Mode**
  - **Toggle Theatre Mode**: `t` (custom, replaces needing `⌥+t`, **implemented**)
- **Live Rewind / Live**
  - **Skip to Live**: `l` (custom; activates the “LIVE” control when you’ve rewound, **implemented**)
- **Misc**
  - **Clip**: `⌥+x` (Twitch built-in)
  - **Mute/Unmute**: `m` (Twitch built-in)

<!-- CONTROLS:END -->

### Build

From the project folder:

```bash
pnpm run build
```

This produces `dist/index.js`.

### Install in Zen Browser (persistent)

Build the extension package:

```bash
pnpm run build:extension
```

In Zen, open `about:addons`, select the gear menu, choose **Install Add-on From File…**, and select `BetterTwitchControls-Zen-1.2.0.xpi`.

The package has a stable Firefox extension ID, making it eligible for a persistent add-on installation instead of an `about:debugging` temporary load. Firefox-family release builds require an AMO-signed XPI; Zen installations that enforce extension signing must use the AMO-signed package.

### Install in Chrome / Arc / Brave (Extension)

- **Build**: `pnpm run build`
- **Open extensions page**:
  - Chrome/Brave: `chrome://extensions`
  - Arc: `arc://extensions`
- **Enable**: Developer mode
- **Click**: “Load unpacked”
- **Select folder**: the repo root (`BetterTwitchControls/`) — the one containing `manifest.json`

The content script only runs on `twitch.tv` due to `manifest.json` match patterns, and `index.ts` also has a runtime guard as a second safety net.

### Optional: Load unpacked without `node_modules/`

If you don’t want to “Load unpacked” the repo root (which may contain `node_modules/`), run:

```bash
pnpm run build:extension
```

Then “Load unpacked” the generated `extension/` folder.

### Keep README controls in sync

Edit `CONTROLS.md`, then run:

```bash
pnpm run sync:docs
```
