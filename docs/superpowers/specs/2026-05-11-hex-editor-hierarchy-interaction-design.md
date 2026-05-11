# Hex Editor Hierarchy Interaction Design

## Goal

Implement the editor-friendly version of the hex start flow: models stay within a single hex tile, models receive stronger lighting/material presentation, and the opening interaction uses a default clickable tile that leads to card selection, building placement, and visible adjacent unlock costs.

## Chosen Approach

Use scene and prefab hierarchy as the stable structure, with script logic only updating visibility, text, color, and selected prefab contents. The runtime still creates the procedural hex board, but persistent editor nodes hold interaction overlays and visual containers so designers can inspect and adjust the flow in LayaAir IDE.

## Scene Structure

- `Scene3D/HexBoard/DefaultClickableTileMarker`: persistent marker/highlight for the default opening tile.
- `Scene3D/Buildings/InitialBuildSlot`: persistent slot where the selected card's building appears after the opening choice.
- `GameUIRoot/UnlockCostLayer`: persistent 2D layer for adjacent tile cost labels.

These nodes are created through the incremental scaffold command so `assets/Scene.ls` keeps a clear hierarchy. Runtime code binds to them by scene property when possible and falls back to creating them if missing.

## Behavior

- Opening tile is fixed at `(3,7)`, adjacent to the player base, and marked as the first valid click target.
- First click claims that tile without spending money, opens the three-card panel, and waits for the card choice.
- The selected card is applied to the opening tile slot instead of an arbitrary latest owned tile.
- Adjacent buildable neutral tiles show unlock cost labels around the opening building. Labels display `25` normally and red when current money is below the unlock cost.
- Later successful unlocks keep showing costs around the latest claimed tile.

## Visual Rules

- Building models use a conservative editor-friendly scale cap so their footprint stays inside one hex tile.
- Base and building scale constants are reduced and centralized.
- Directional light is strengthened and ambient light is set at runtime to make model materials readable under the oblique camera.
- Fallback geometry remains available if a matched prefab fails to load.

## Tests

- Source-level tests verify the fixed opening tile, explicit scene hierarchy hooks, initial build slot usage, model scale cap, and unlock cost label red-state logic.
- Existing rule tests continue to verify adjacency and first-claim behavior.
- TypeScript compilation and Laya asset validation verify integration.
