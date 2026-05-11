# UI Layer Refactor And Figma Redraw Design

## Context

The current playable screen mixes HUD, board overlays, guide text, card choice UI, and result UI in the same visual plane. In the captured card-choice state, the bottom card panel overlaps the tutorial text, unlock-cost markers, HP bars, and the board. This makes the screen hard to parse and makes the card-selection moment feel noisy instead of decisive.

The fix is a UI hierarchy refactor, not another one-off position adjustment.

## Goals

- Separate UI into explicit layers with one responsibility each.
- Make card choice a modal state that suppresses board overlays while it is active.
- Keep battle HUD readable in a 9:16 mobile frame.
- Produce a Figma redraw that documents the target UI structure and can be reused as the visual reference.
- Preserve existing gameplay rules and card selection behavior.

## Target Layers

1. `HUD Layer`
   - Contains the timer and coin wallet only.
   - Stays visible in tutorial, battle, and card-choice states.
   - Uses top safe-area placement so it does not collide with HP bars.

2. `World Overlay Layer`
   - Contains board-bound UI only: HP bars and unlock-cost labels.
   - Visible in tutorial and battle.
   - Hidden during card choice and result states.

3. `Guide Layer`
   - Contains first-tap highlight, hand pointer, and short guide text.
   - Visible only for tutorial/guide moments.
   - Hidden when the player opens card choice.

4. `Modal Layer`
   - Contains card choice UI.
   - Visible only while `pausedForCards` is true.
   - Presents a bottom modal panel with three clean card options.
   - Board overlays are hidden while this layer is active.

5. `Result Layer`
   - Contains win/loss panel and CTA.
   - Visible only after game finish.
   - Suppresses guide, modal, and world overlays.

## UI Modes

The runtime should expose a small internal UI mode state:

- `tutorial`: HUD + world overlay + guide visible.
- `battle`: HUD + world overlay visible; guide/modal/result hidden.
- `cardChoice`: HUD + modal visible; world overlay/guide/result hidden.
- `result`: result visible; world overlay/guide/modal hidden; CTA visible.

The mode should be set at key flow points:

- `onAwake`: `tutorial`
- after first attack starts: `battle`
- when card choices show: `cardChoice`
- after a card is picked: `battle`
- when game finishes: `result`

## Layout Rules

- Design basis remains `1080 x 1920`.
- Timer: top center, compact, no overlap with enemy HP.
- Coin wallet: top right HUD, not inside the card panel zone.
- Guide text: smaller than the previous oversized text and only visible in guide states.
- Card modal: bottom anchored, width-constrained, title inside the panel, three equal card buttons.
- Unlock cost labels and HP bars must never render over card modal.

## Figma Redraw

Create a Figma design file named `占城大师 UI Layer Redraw`.

It must contain two 9:16 frames:

- `Gameplay - Layered UI`
  - Shows clean HUD, board, HP bars, and unlock-cost labels.
  - Uses visible layer names matching runtime layers.

- `Card Choice - Modal State`
  - Shows HUD and a bottom card modal.
  - Board overlays are absent or muted.
  - Three cards use icon, title, and one-line effect text.

## Testing

Add source-level tests under `.temp` to lock the layer contract:

- `setupUiLayers()` exists and creates layer names.
- Existing UI nodes are reparented to the correct layer.
- `setUiMode()` controls layer visibility for all four modes.
- HP bars and unlock-cost labels use `World Overlay Layer`.
- First-tap prompt uses `Guide Layer`.
- Card panel uses `Modal Layer`.
- Card choice calls `setUiMode("cardChoice")`.
- Card pick returns to `setUiMode("battle")`.
- Finish calls `setUiMode("result")`.

Run these checks after implementation:

- `node .temp/ui-layer-refactor.test.mjs`
- `node .temp/card-option-ui.test.mjs`
- `node .temp/ui-reference-layout.test.mjs`
- `node .temp/hex-rules.test.mjs`
- `npm.cmd run typecheck`

## Non-Goals

- Do not change hex rule logic.
- Do not rebalance card effects, economy, tower damage, or enemy spawning.
- Do not rebuild the Laya scene file unless a required node is missing.
- Do not add new remote dependencies.
