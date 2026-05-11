# Spawn Flow And Cooldown Design

## Goal

Improve the playable flow so the match does not start automatically. The first player action creates the starting buildings for both sides, then the battle loop begins. Soldier spawning must be communicated with a visible circular cooldown indicator that completes one loop per spawned unit.

## Current Context

- Main runtime logic is in `src/game/HexGameController.ts`.
- Hex claim rules are in `src/data/HexRules.ts`.
- The current game starts timers immediately in `onUpdate`, and player/enemy bases spawn units through global spawn timers.
- Buildings are stored in the `buildings` array, but they do not own cooldown progress or UI indicators.

## Chosen Approach

Use an incremental change inside the existing controller. This keeps the iteration small, preserves the tuned camera and board layout, and avoids regenerating the scene.

## Gameplay Design

- On first entry, the game is in a waiting state.
- While waiting, timer, income, cards, unit movement, combat, and spawning do not advance.
- The hint tells the player to click a tile to build the first outpost and start the battle.
- The first valid click claims the selected tile, creates the player's initial spawn building there, creates the enemy's initial spawn building near the enemy side, and starts the game loop.
- Later card-created spawn buildings use the same cooldown system.

## Spawn Cooldown Design

- Each spawn-capable building owns its own cooldown progress.
- Progress increases by `dt / spawnRate` while the game is running.
- When progress reaches 1, the building spawns one soldier and progress wraps back to 0.
- Dragon buildings spawn strong units; normal player buildings spawn player soldiers; enemy buildings spawn enemy soldiers or dragons according to existing late-game pressure rules.
- Card pause and result pause freeze cooldown progress.

## Progress Indicator Design

- Each spawn-capable building gets a small circular 2D progress indicator registered with the building data.
- The indicator is positioned by mapping the building world position onto the current UI root coordinate space.
- The indicator clears and redraws every frame with a background ring plus a filled arc/pie segment representing progress.
- On spawn, the indicator briefly resets to empty, making the next cycle readable.

## Testing Design

- Add a lightweight Node-based regression test in `.temp/` for pure spawn cooldown behavior.
- Cover these cases: waiting state blocks ticking, first start creates both sides' initial spawners, cooldown reaching one full cycle emits one spawn and resets progress.
- Keep existing TypeScript compile and hex rule tests as verification.

## Scope

- Modify `src/game/HexGameController.ts`.
- Append the incremental requirement to `doc/output/requirements.md`.
- Update `.opencode/workflow-state.md` iteration records after implementation.
- Update `MEMORY.md` with useful implementation notes after verification.

## Non-Goals

- Do not rebuild the scene through the full scaffold flow.
- Do not replace art assets.
- Do not change camera, board geometry, CTA, or card panel layout unless required by the cooldown indicator.
