# Camera Composition Design

## Goal

Reduce the large low-information screen areas in the vertical playable view while keeping the battlefield readable, the 7x10 core hex layout intact by default, and the bottom CTA/result safe area available.

This spec covers camera composition and optional board fill strategy only. It does not change combat rules, economy values, card behavior, building behavior, or conversion flow.

## Source Context

- `doc/game/prd.md` and `doc/output/requirements.md` require a vertical LayaAir 3.x playable with a fixed overhead/oblique camera that shows the full battlefield.
- Current implementation configures the runtime camera in `src/game/HexGameController.ts` with perspective projection, `fieldOfView = 42`, position `(0, 31, 11.5)`, and rotation `(-66, 0, 0)`.
- Recent requirements history repeatedly pulled the camera farther away to protect full edge tiles. The current screenshot shows that this solved edge clipping but introduced too much empty water/background between the HUD and the board and around the lower board area.
- Existing `.temp/camera-angle.test.mjs` locks the current camera values, so any camera adjustment must update that regression coverage.
- The current board data is a 7-column by 10-row playable grid with player base at `(3,8)` and enemy base at `(3,1)`.

## Chosen Approach

Use option B from the visual comparison: move to an upper, closer board-first composition.

The first implementation pass should only adjust camera composition and dependent projection expectations. The playable grid remains 7x10 unless preview verification still shows a large unused area after the B camera pass.

If the B camera pass still leaves obvious dead space, add more visible hex coverage as a second pass. That fill should be conservative:

- Prefer non-disruptive visual expansion before changing core rules.
- Keep the player and enemy bases in their current strategic relationship.
- Preserve the early playable-ad rhythm: immediate visible battlefield, clear first card/building feedback, readable unlock costs, and no bottom CTA obstruction during normal play.

## Camera Composition Target

The camera should present the battlefield closer to the B option in `.superpowers/brainstorm/camera-layout-options.html`.

Expected screen result in a 9:16 preview:

- The top of the visible hex board starts shortly below the HUD zone instead of leaving a broad water band.
- The board occupies more of the middle vertical screen, with the enemy side visible near the upper-middle and player side visible near the lower-middle.
- Left and right water margins remain visible, but should read as background gutters rather than empty primary content.
- Bottom space is reduced, but still leaves a safe region for result/CTA states and avoids clipping the player base, HP bar, unlock costs, and active units.
- Full edge tiles should remain visible. Minor water/background at the outer edge is acceptable; large empty bands are not.

The camera should remain fixed during gameplay. Do not add dynamic zoom or panning.

## Optional Hex Fill Strategy

Only use this strategy if the B camera composition still leaves a noticeable empty band after preview verification.

Recommended fill order:

1. Add decorative/non-playable edge hexes or water/void border cells that visually occupy empty space without changing the unlock economy.
2. If decorative fill is insufficient, expand the actual grid dimensions in a controlled way and update rule tests and requirements text together.

If actual playable dimensions are expanded:

- Keep base positions visually equivalent: enemy remains near the upper-center lane, player remains near the lower-center lane.
- Keep initial focus and unlock candidates centered around the player base.
- Update `createInitialHexGrid`, camera tests, any layout constants, and requirements notes in one coherent change.
- Avoid making the board so large that card panels, HP bars, or unlock cost markers become cramped.

## Code Boundaries

Expected files for implementation:

- `src/game/HexGameController.ts`
  - Adjust `setupCamera()` values.
  - Keep perspective projection unless preview evidence shows it is the source of wasted space.
  - Keep world-to-UI projection and picking behavior coherent with the new camera.
- `.temp/camera-angle.test.mjs`
  - Update regression expectations for the new camera values and composition intent.
- `doc/output/requirements.md`
  - Add a concise increment note only if implementation changes the camera target or grid/fill behavior.
- `src/data/HexRules.ts`
  - Modify only if the second-pass actual grid expansion is chosen.

Do not edit unrelated assets or model scale parameters as part of the camera pass.

## Testing And Verification

Required checks after implementation:

- `node .temp/camera-angle.test.mjs`
- `node .temp/hex-rules.test.mjs`
- `npm run typecheck`

Manual preview requirements:

- Capture or inspect a 9:16 game view after the camera change.
- Confirm the board is higher and larger than the current screenshot.
- Confirm edge tiles are not clipped.
- Confirm HP bars, unlock cost labels, the tutorial hand, card panel, and result/CTA state remain readable.
- If large empty space remains, document the remaining area before deciding whether to activate the optional hex fill pass.

## Non-Goals

- Do not redesign the HUD, card panel, result panel, unit models, or water material.
- Do not change combat/economy/card values to compensate for composition.
- Do not add moving camera behavior.
- Do not expand playable grid dimensions in the first pass unless preview verification proves camera-only adjustment cannot solve the empty-area problem.
