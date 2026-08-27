
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
