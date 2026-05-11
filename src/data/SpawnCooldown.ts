export interface SpawnCooldownState {
    duration: number;
    progress: number;
}

export interface SpawnCooldownTickResult {
    state: SpawnCooldownState;
    spawnCount: number;
}

export function createSpawnCooldown(duration: number): SpawnCooldownState {
    return { duration: Math.max(0.001, duration), progress: 0 };
}

export function tickSpawnCooldown(state: SpawnCooldownState, dt: number, running: boolean): SpawnCooldownTickResult {
    if (!running || dt <= 0) {
        return { state: { ...state }, spawnCount: 0 };
    }
    const rawProgress = state.progress + dt / Math.max(0.001, state.duration);
    const spawnCount = Math.floor(rawProgress);
    return {
        state: { duration: state.duration, progress: rawProgress - spawnCount },
        spawnCount
    };
}
