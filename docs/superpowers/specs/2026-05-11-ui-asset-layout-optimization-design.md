# UI Asset Layout Optimization Design

## Goal

Optimize the playable ad UI layout and asset usage to match the two reference screenshots: a 9:16 vertical board-first presentation with a large edge-to-edge hex map, a centered timer, a right-side coin wallet, clear first-tap guidance, readable unlock costs, and a focused battle-state layout.

This spec covers UI layout, asset usage, and runtime presentation rules only. It does not change core hex rules, economy values, combat values, or card effects.

## Source Context

- Product docs require a LayaAir 3.x vertical Web playable at 1080x1920.
- The ad experience must make the first interaction understandable within 3 seconds and show card/building feedback within the first 10 seconds.
- Existing UI assets are already listed in `doc/output/resource_list.json` and partially wired in `src/game/HexGameController.ts`:
  - Card panel: `downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png`
  - Card option: `downloads/2d/card_option/CardFrame_01_White_Bg.png`
  - Result panel: `downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png`
  - Tutorial hint: `downloads/2d/tutorial_hint/info.png`
  - Coin icon: `downloads/2d/ui/coin_2.png`
  - Button background: `downloads/2d/ui/Button_01_White_Bg.Png`

## Chosen Approach

Use the reference screenshots as a layout target and implement the polish inside the existing Laya scene and `HexGameController` runtime UI code. The scene continues to hold persistent UI nodes, while the controller updates visibility, position, text, skin, color, and projected cost markers.

The design intentionally keeps this as a focused iteration:

- Reuse the current Laya UI assets instead of introducing new art dependencies.
- Adjust the screen composition to match the reference before deeper visual system work.
- Keep the card and result panels functional, but prioritize the board, timer, coin wallet, first-tap prompt, and unlock costs.

Figma handoff is outside this iteration unless a target Figma file is provided. For this iteration, the source of truth is this spec plus the Laya scene/runtime implementation.

## Screen Composition

The playable uses a fixed 9:16 design basis matching 1080x1920.

- Board area:
  - Hex board starts near the top after the timer area, around 15% of screen height.
  - Board height runs close to the bottom edge, around 96% of screen height.
  - Board width is slightly wider than the screen so the left and right outer hexes can feel cropped at the edges, matching the reference.
  - Water/background remains visible through holes and side gutters.
- Timer:
  - Centered at the top.
  - Uses a dark rounded rectangle and bold white text with dark shadow/stroke.
  - No extra top HUD labels should compete with it.
- Coin wallet:
  - Anchored to the right side in the lower-middle area.
  - Uses the coin icon and current money value.
  - Shape should read like a compact purple/dark tab entering from the right edge.
- CTA:
  - Hidden during normal play.
  - Appears with the result panel or other explicit conversion state only.

## State 1: First-Tap Guidance

The first-tap state follows the first reference screenshot.

- Board:
  - Most tiles are neutral gray.
  - One enemy/core tile appears near upper-center in dark red.
  - The water hole remains visible near the board center.
  - One bottom-center target tile is highlighted in player green.
- Tutorial:
  - Large prompt text sits over the middle-lower board area.
  - Current copy may remain Chinese in production, but the layout should support the reference-style message size and stroke.
  - Suggested Chinese copy: `点击绿色地块进攻！`
  - Text uses high-contrast white fill with dark stroke/shadow.
- Hand prompt:
  - The hand image is positioned over or just beside the target green tile.
  - A translucent white rounded highlight sits behind the target area.
  - It should not hide the coin cost or make the target tile ambiguous.
- Unlock cost:
  - The target tile displays coin icon + `25`.
  - The marker is centered on or slightly above the target tile.
  - The marker uses yellow/white with dark stroke when affordable.

## State 2: Battle Expansion

The battle state follows the second reference screenshot.

- Enemy cluster:
  - Red enemy-owned tiles form a compact cluster around the upper-center enemy base.
  - Enemy base/model sits on top of the cluster.
  - Enemy HP bar appears above or across the base, with readable `100`.
- Player cluster:
  - Green player-owned tiles form a compact cluster near the bottom-center player base/building.
  - Player building/model sits on the cluster center.
  - Player HP bar appears above or across the model, with readable `100`.
- Unlock costs:
  - Adjacent unlockable neutral tiles around the player cluster show coin icon + `25`.
  - Labels should track projected tile centers under the active camera.
  - Labels use affordable and unaffordable color states:
    - Affordable: yellow/white text with dark stroke.
    - Unaffordable: red text with dark stroke.
- Skip/fast-forward affordance:
  - Optional small circular button at the top-right can be added if needed.
  - It is not required for this implementation unless already supported by the scene.

## UI Asset Rules

- Use `coin_2.png` for all coin markers and wallet icons.
- Use `Button_01_White_Bg.Png` as a tintable background for CTA and strong buttons.
- Use the card panel and card option assets through Laya skin/sizeGrid where possible.
- Use the result panel asset for the settlement popup.
- Use `tutorial_hint/info.png` only as an auxiliary tutorial icon. The hand prompt should continue to use `downloads/2d/ui/hand.png` when available.
- Avoid creating one-off duplicated image resources for each marker. Runtime should clone or instantiate the same source assets.

## Runtime Layout Rules

- All UI positions are derived from the 1080x1920 design basis or from current stage dimensions through scale factors.
- Board-dependent labels, especially unlock costs and HP bars, should use camera projection when possible.
- Fallback projection may be kept, but it must preserve the reference layout in the 1080x1920 vertical scene.
- UI creation must be idempotent:
  - Re-entering `onAwake` or reapplying skins should not create duplicate panel skins, tutorial icons, hand prompts, or cost labels.
  - Cost labels should be cleared and recreated only through the existing unlock-cost refresh flow.
- Runtime skin application must not break current scene references for `cardButtonA`, `cardButtonB`, `cardButtonC`, `resultCtaButton`, and `ctaButton`.

## Scene And Code Boundaries

Expected scene-level nodes:

- `GameUIRoot/TimerLabel`
- `GameUIRoot/MoneyLabel`
- `GameUIRoot/HintLabel`
- `GameUIRoot/CardChoicePanel`
- `GameUIRoot/ResultPanel`
- `GameUIRoot/CTAButton`
- `GameUIRoot/UnlockCostLayer`
- `Scene3D/HexBoard`
- `Scene3D/Bases`
- `Scene3D/Buildings`
- `Scene3D/Units`

Expected controller responsibilities:

- Apply 9:16 reference positioning at runtime for timer, hint, coin wallet, card panel, result panel, and CTA.
- Keep `MoneyLabel` available as the right-side wallet instead of a plain top-right HUD label.
- Create or style the first-tap hand/highlight affordance without changing game rules.
- Project unlock cost labels and HP bars to screen space.
- Preserve existing card selection, building placement, spawn cooldown, and CTA click behavior.

## Testing And Verification

Implementation should add source-level regression coverage before production changes.

Required checks:

- A new `.temp` UI layout regression test verifies the controller contains:
  - 9:16 layout constants or design-basis helpers.
  - First-tap prompt/highlight setup.
  - Right-side coin wallet styling using `coin_2.png`.
  - Projected unlock cost markers with coin icon + cost.
  - CTA hidden during play and visible on result.
  - Idempotent UI skin or overlay creation guards.
- Existing rule check: `node .temp/hex-rules.test.mjs`
- TypeScript check: `npm run typecheck`
- If scene JSON is modified, validate `assets/Scene.ls` with the existing Laya scene validation path.

Manual preview target:

- In a 1080x1920 vertical preview, the board should visually match the two references:
  - First-tap: one green bottom target tile, large center-lower instruction, hand over target, right-side wallet.
  - Battle: red upper cluster, green lower cluster, readable HP bars, cost labels around the player cluster.

## Non-Goals

- Do not redesign combat, card effects, economy, or win/loss logic.
- Do not replace the current 3D building/unit assets.
- Do not add a persistent in-game bottom CTA during normal play.
- Do not require a Figma file before implementation.
