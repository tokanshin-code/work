export type TileOwner = "neutral" | "player" | "enemy";
export type TileKind = "normal" | "water" | "lava" | "void" | "base";

export interface HexTileState {
    col: number;
    row: number;
    owner: TileOwner;
    kind: TileKind;
}

export function createInitialHexGrid(cols: number, rows: number): HexTileState[] {
    const tiles: HexTileState[] = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let owner: TileOwner = "neutral";
            let kind: TileKind = "normal";
            if (col === 3 && row === 8) {
                owner = "player";
                kind = "base";
            } else if (col === 3 && row === 1) {
                owner = "enemy";
                kind = "base";
            } else if ((col === 0 && row === 4) || (col === 6 && row === 5)) {
                kind = "water";
            } else if ((col === 1 && row === 2) || (col === 5 && row === 7)) {
                kind = "lava";
            } else if ((col === 0 && row === 0) || (col === 6 && row === 9)) {
                kind = "void";
            }
            tiles.push({ col, row, owner, kind });
        }
    }
    return tiles;
}

export function getTile(tiles: HexTileState[], col: number, row: number): HexTileState {
    const tile = tiles.find((item) => item.col === col && item.row === row);
    if (!tile) {
        throw new Error(`Missing hex tile ${col},${row}`);
    }
    return tile;
}

export function isAdjacent(aCol: number, aRow: number, bCol: number, bRow: number): boolean {
    return getHexDistance(aCol, aRow, bCol, bRow) === 1;
}

export function getHexDistance(aCol: number, aRow: number, bCol: number, bRow: number): number {
    const a = offsetToAxial(aCol, aRow);
    const b = offsetToAxial(bCol, bRow);
    const dq = Math.abs(a.q - b.q);
    const dr = Math.abs(a.r - b.r);
    const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
    return Math.max(dq, dr, ds);
}

export function canClaimTile(tiles: HexTileState[], col: number, row: number, money: number, hexCost: number, isFirstClaim: boolean): boolean {
    const tile = getTile(tiles, col, row);
    if (tile.owner !== "neutral" || tile.kind === "void" || tile.kind === "water") {
        return false;
    }
    if (isFirstClaim) {
        return true;
    }
    if (!isFirstClaim && money < hexCost) {
        return false;
    }
    return tiles.some((item) => item.owner === "player" && isAdjacent(item.col, item.row, col, row));
}

export function claimTile(tiles: HexTileState[], col: number, row: number): HexTileState[] {
    return tiles.map((tile) => tile.col === col && tile.row === row ? { ...tile, owner: "player" as TileOwner } : tile);
}

export function calculateIncome(tiles: HexTileState[], rewardPerTile: number): number {
    return tiles.filter((tile) => tile.owner === "player").length * rewardPerTile;
}

function offsetToAxial(col: number, row: number): { q: number; r: number } {
    return { q: col, r: row - Math.floor((col - (col & 1)) / 2) };
}
