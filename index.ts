
/**
 * BetterTwitchControls
 * - Press "c" anywhere (when you're NOT already typing) to focus Twitch chat input.
 *
 * Works with Twitch's WYSIWYG + 7TV because it targets Twitch's stable data attributes:
 *   - [data-a-target="chat-input"]
 *   - [data-test-selector="chat-input"]
 */
const INSTALL_FLAG = "__betterTwitchControlsInstalled__";
const isTwitchDomain = () => {
  try {
    const host = window.location.hostname || "";
    if (host === "twitch.tv") return true;
    const suffix = "twitch.tv";
    if (host.length <= suffix.length) return false;
    if (host.substring(host.length - suffix.length) !== suffix) return false;
    // Ensure it's a subdomain like "<something>.twitch.tv"
    return host.charAt(host.length - suffix.length - 1) === ".";
  } catch {
    return false;
  }
};

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLInputElement) {
    // Treat range sliders (like Twitch volume) as "non-editable" so our hotkeys still work.
    if ((el.getAttribute("type") || "").toLowerCase() === "range") return false;
    return true;
  }
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLSelectElement) return true;
  const htmlEl = el as HTMLElement;
  if (htmlEl.isContentEditable) return true;
  return false;
}

function getChatInputEl(): HTMLElement | null {
  // Prefer Twitch's stable target attributes.
  const selectors = [
    '[data-a-target="chat-input"]',
    '[data-test-selector="chat-input"]',
    '.chat-wysiwyg-input__editor',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) return el;
  }

  return null;
}

function isChatInputFocused(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;

  // If focus is on the editor itself, this will be true.
  if (
    active.matches?.(
      '[data-a-target="chat-input"], [data-test-selector="chat-input"], .chat-wysiwyg-input__editor',
    )
  ) {
    return true;
  }

  // Or if a descendant is focused (e.g. 7TV / Slate internals).
  return Boolean(
    active.closest?.(
      '[data-a-target="chat-input"], [data-test-selector="chat-input"], .chat-wysiwyg-input__editor',
    ),
  );
}

function focusChatInput(chatInput: HTMLElement) {
  // Slate-based editors sometimes respond better to click() + focus().
  try {
    chatInput.click();
  } catch {
    // ignore
  }

  try {
    // preventScroll isn't supported everywhere; cast keeps TS happy.
    chatInput.focus({ preventScroll: true } as any);
  } catch {
    chatInput.focus();
  }

  // Move caret to end (best-effort). If Slate blocks it, focus still works.
  try {
    const sel = window.getSelection?.();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(chatInput);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    // ignore
  }
}

function getPlayerFocusTarget(): HTMLElement | null {
  // Prefer an actual focusable control button.
  const selectors = [
    '[data-a-target="player-play-pause-button"]',
    '[data-a-target="player-controls"]',
    "#channel-player",
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) return el;
  }

  return null;
}

function focusPlayerControls() {
  const target = getPlayerFocusTarget();
  if (!target) return;

  // If it's not naturally focusable, make it programmatically focusable.
  if (target.tabIndex < 0 && !(target instanceof HTMLButtonElement)) {
    // Avoid clobbering existing tabindex=0 etc.
    const hasTabIndexAttr = target.hasAttribute("tabindex");
    if (!hasTabIndexAttr) target.setAttribute("tabindex", "-1");
  }

  try {
    target.focus({ preventScroll: true } as any);
  } catch {
    target.focus();
  }
}

function canStealFocusForPlayer(): boolean {
  if (document.visibilityState !== "visible") return false;
  const active = document.activeElement;
  // Don't steal focus if user is typing anywhere.
  if (isEditableElement(active)) return false;
  return true;
}

function autoFocusPlayerControlsOnceReady() {
  if (!canStealFocusForPlayer()) return;

  // Try immediately + a couple delayed retries (player mounts async).
  focusPlayerControls();
  window.setTimeout(() => {
    if (!canStealFocusForPlayer()) return;
    focusPlayerControls();
  }, 600);
  window.setTimeout(() => {
    if (!canStealFocusForPlayer()) return;
    focusPlayerControls();
  }, 1800);

  // Also watch for player controls being inserted (Twitch is SPA-ish).
  try {
    const obs = new MutationObserver(() => {
      if (!canStealFocusForPlayer()) return;
      const controls = document.querySelector('[data-a-target="player-controls"]');
      if (!controls) return;
      focusPlayerControls();
      obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => obs.disconnect(), 8000);
  } catch {
    // ignore
  }
}

function isPlayerControlsFocused(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;

  // Focus may be on a button inside the controls, or on the controls container itself.
  return Boolean(
    active.closest?.('[data-a-target="player-controls"], #channel-player'),
  );
}

function getTheatreModeToggleButton(): HTMLButtonElement | null {
  // Twitch labels this control with "(alt+t)" and either "Theatre Mode" or "Exit Theatre Mode".
  const selectors = [
    'button[aria-label*="(alt+t)"][aria-label*="Theatre"]',
    'button[aria-label*="(alt+t)"][aria-label*="theatre"]',
  ];

  for (let i = 0; i < selectors.length; i++) {
    const el = document.querySelector(selectors[i]);
    if (el instanceof HTMLButtonElement) return el;
  }

  // Fallback: scan buttons without using ES2015+ helpers.
  const allButtons = document.querySelectorAll("button");
  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    if (!(btn instanceof HTMLButtonElement)) continue;
    const label = btn.getAttribute("aria-label") || "";
    if (!label) continue;
    if (label.indexOf("(alt+t)") === -1) continue;
    if (label.indexOf("Theatre") === -1 && label.indexOf("theatre") === -1)
      continue;
    return btn;
  }

  return null;
}

function toggleTheatreMode() {
  const btn = getTheatreModeToggleButton();
  if (!btn) return;
  btn.click();
}

function getPlayerControlsRoot(): HTMLElement | null {
  const selectors = ['[data-a-target="player-controls"]', "#channel-player"];
  for (let i = 0; i < selectors.length; i++) {
    const el = document.querySelector(selectors[i]);
    if (el instanceof HTMLElement) return el;
  }
  return null;
}

function getSkipToLiveControl(): HTMLElement | null {
  // The control isn't always present (only after rewinding). It's focusable (tabindex="0")
  // and its visible text is typically "LIVE".
  const root = getPlayerControlsRoot() || document.body;
  if (!root) return null;

  const focusables = root.querySelectorAll('[tabindex="0"]');
  for (let i = 0; i < focusables.length; i++) {
    const el = focusables[i];
    if (!(el instanceof HTMLElement)) continue;

    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    // Avoid ES2015+ String helpers to keep compatibility with older targets.
    if (text.indexOf("LIVE") !== 0) continue;

    return el;
  }

  return null;
}

function activateSkipToLive() {
  const el = getSkipToLiveControl();
  if (!el) return;

  // Prefer click if Twitch attaches a click handler.
  try {
    el.click();
    return;
  } catch {
    // ignore
  }

  // Fallback: focus + Enter (you confirmed Enter works when focused).
  try {
    el.focus({ preventScroll: true } as any);
  } catch {
    try {
      el.focus();
    } catch {
      // ignore
    }
  }

  try {
    const down = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    } as any);
    el.dispatchEvent(down);
    const up = new KeyboardEvent("keyup", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    } as any);
    el.dispatchEvent(up);
  } catch {
    // ignore
  }
}

function getVolumeSlider(): HTMLInputElement | null {
  const el = document.querySelector('[data-a-target="player-volume-slider"]');
  return el instanceof HTMLInputElement ? el : null;
}

function isVolumeSliderFocused(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  return Boolean(active.closest?.('[data-a-target="player-volume-slider"]'));
}

function setRangeValue(slider: HTMLInputElement, next: number) {
  const min = Number(slider.min || 0);
  const max = Number(slider.max || 1);
  const clamped = Math.min(max, Math.max(min, next));
  slider.value = String(clamped);

  // Let Twitch react as if the user moved the slider.
  try {
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  } catch {
    // ignore
  }
}

function adjustVolume(delta: number) {
  const slider = getVolumeSlider();
  if (!slider) return;

  const current = Number(slider.value || 0);
  const stepAttr = Number(slider.step || 0.01);
  const step = stepAttr > 0 ? stepAttr : 0.01;

  setRangeValue(slider, current + delta * step);
}

const SHORTCUT_OVERLAY_ID = "better-twitch-controls-shortcuts";
const SHORTCUTS = [
  ["1–9", "Open the corresponding sidebar stream"],
  ["Shift + 1–9", "Open the corresponding sidebar stream in a new tab"],
  ["?", "Show or hide this shortcut guide"],
  ["c", "Focus chat"],
  ["Esc", "Leave chat and focus player controls"],
  ["t", "Toggle Theatre Mode"],
  ["l", "Skip to Live"],
  ["↑ / ↓", "Adjust volume"],
];

function getSidebarStream(index: number): HTMLAnchorElement | null {
  const streams = document.querySelectorAll<HTMLAnchorElement>(
    'a.side-nav-card__link[href]',
  );
  return streams[index] || null;
}

function openSidebarStream(index: number, inNewTab: boolean) {
  const stream = getSidebarStream(index);
  if (!stream) return;

  if (inNewTab) {
    window.open(stream.href, "_blank", "noopener");
    return;
  }

  stream.click();
}

function getShortcutOverlay(): HTMLElement | null {
  const overlay = document.getElementById(SHORTCUT_OVERLAY_ID);
  return overlay instanceof HTMLElement ? overlay : null;
}

function toggleShortcutOverlay() {
  const existing = getShortcutOverlay();
  if (existing) {
    existing.remove();
    return;
  }

  const overlay = document.createElement("section");
  overlay.id = SHORTCUT_OVERLAY_ID;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Better Twitch Controls shortcuts");

  const style = document.createElement("style");
  style.textContent = `
    #better-twitch-controls-shortcuts {
      position: fixed; z-index: 2147483647; top: 5rem; right: 1.5rem;
      width: min(32rem, calc(100vw - 3rem)); padding: 1.25rem;
      border: 1px solid #9147ff; border-radius: .5rem;
      background: #18181b; box-shadow: 0 .5rem 2rem rgb(0 0 0 / .55);
      color: #efeff1; font: 14px/1.4 Inter, Helvetica, Arial, sans-serif;
    }
    #better-twitch-controls-shortcuts h2 { margin: 0 0 1rem; font-size: 1.125rem; }
    #better-twitch-controls-shortcuts dl {
      display: grid; grid-template-columns: max-content 1fr; gap: .625rem 1rem;
      margin: 0;
    }
    #better-twitch-controls-shortcuts dt {
      padding: .125rem .375rem; border-radius: .25rem;
      background: #303035; color: #fff; font-weight: 700;
    }
    #better-twitch-controls-shortcuts dd { margin: 0; }
  `;

  const heading = document.createElement("h2");
  heading.textContent = "Better Twitch Controls";
  const shortcuts = document.createElement("dl");
  for (const [key, description] of SHORTCUTS) {
    const term = document.createElement("dt");
    term.textContent = key;
    const definition = document.createElement("dd");
    definition.textContent = description;
    shortcuts.append(term, definition);
  }

  overlay.append(style, heading, shortcuts);
  document.body.append(overlay);
}

function getStreamShortcutIndex(e: KeyboardEvent): number | null {
  if (e.altKey || e.ctrlKey || e.metaKey) return null;
  if (!/^Digit[1-9]$/.test(e.code)) return null;
  return Number(e.code.substring("Digit".length)) - 1;
}

function onKeyDown(e: KeyboardEvent) {
  if (e.defaultPrevented) return;
  if (e.isComposing) return;

  const active = document.activeElement;

  // If the Twitch volume slider is focused, it "eats" many keys. We redirect common player keys
  // back to the player controls so shortcuts keep working.
  if (isVolumeSliderFocused()) {
    const k = e.key;
    const isSpace = k === " " || k === "Space" || k === "Spacebar";
    const passthroughKeys =
      k === "ArrowLeft" ||
      k === "ArrowRight" ||
      k === "k" ||
      k === "K" ||
      k === "m" ||
      k === "M" ||
      k === "Escape" ||
      isSpace;

    // Let our custom handlers run for these keys instead.
    const handledByUs =
      k === "c" ||
      k === "C" ||
      k === "t" ||
      k === "T" ||
      k === "l" ||
      k === "L" ||
      k === "ArrowUp" ||
      k === "ArrowDown";

    if (passthroughKeys && !handledByUs) {
      // Stop the slider from adjusting itself / scrolling.
      if (k === "ArrowLeft" || k === "ArrowRight" || isSpace) {
        e.preventDefault();
      }

      focusPlayerControls();
      // Don't stop propagation; let Twitch handle the key with player focus restored.
      return;
    }
  }

  // Esc: when you're typing in chat, exit chat focus back to the player.
  if (e.key === "Escape" && isChatInputFocused()) {
    e.preventDefault();
    e.stopPropagation();
    focusPlayerControls();
    return;
  }

  // If you're already typing anywhere (including chat), don't steal keys.
  if (isEditableElement(active)) return;

  // "?" toggles an in-page shortcut reference.
  if (e.key === "?" && !e.altKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    e.stopPropagation();
    toggleShortcutOverlay();
    return;
  }

  // 1–9 select the visible streams in Twitch's sidebar. Shift opens the stream in a new tab.
  const streamIndex = getStreamShortcutIndex(e);
  if (streamIndex !== null) {
    e.preventDefault();
    e.stopPropagation();
    openSidebarStream(streamIndex, e.shiftKey);
    return;
  }

  // "t": toggle theatre mode when the player controls are focused.
  if (e.key === "t" || e.key === "T") {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!isPlayerControlsFocused()) focusPlayerControls();
    e.preventDefault();
    e.stopPropagation();
    toggleTheatreMode();
    return;
  }

  // "l": Skip to Live when the player controls are focused (button appears after rewinding).
  if (e.key === "l" || e.key === "L") {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!isPlayerControlsFocused()) focusPlayerControls();
    e.preventDefault();
    e.stopPropagation();
    activateSkipToLive();
    return;
  }

  // ArrowUp/ArrowDown: adjust volume via the player volume slider when player controls are focused.
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!isPlayerControlsFocused()) focusPlayerControls();

    // If the slider doesn't exist, don't interfere with scrolling.
    if (!getVolumeSlider()) return;

    e.preventDefault();
    e.stopPropagation();

    // Use slider.step (Twitch typically uses 0.01). Up = louder, Down = quieter.
    adjustVolume(e.key === "ArrowUp" ? 1 : -1);

    // If focus was on the slider (mouse click, etc), unstick it.
    if (isVolumeSliderFocused()) focusPlayerControls();
    return;
  }

  // Only plain "c" (or "C") with no modifiers.
  if (e.key !== "c" && e.key !== "C") return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;

  const chatInput = getChatInputEl();
  if (!chatInput) return;

  // Consume the key so Twitch/player doesn't treat it as anything else.
  e.preventDefault();
  e.stopPropagation();

  focusChatInput(chatInput);
}

function install() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!isTwitchDomain()) return;

  const w = window as any;
  if (w[INSTALL_FLAG]) return;
  w[INSTALL_FLAG] = true;

  // Capture phase so we can grab the key before site handlers if needed.
  window.addEventListener("keydown", onKeyDown, { capture: true });

  // Make theatre-mode + player shortcuts work immediately on page load.
  autoFocusPlayerControlsOnceReady();
}

install();
