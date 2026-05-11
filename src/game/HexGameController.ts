import { GameEvents } from "../data/GameEvents";
import { HexTileState, calculateIncome, canClaimTile, claimTile, createInitialHexGrid } from "../data/HexRules";

const { regClass, property } = Laya;

@regClass()
export class HexGameController extends Laya.Script {
    @property({ type: Laya.Sprite3D }) public hexBoard!: Laya.Sprite3D;
    @property({ type: Laya.Sprite3D }) public basesRoot!: Laya.Sprite3D;
    @property({ type: Laya.Sprite3D }) public buildingsRoot!: Laya.Sprite3D;
    @property({ type: Laya.Sprite3D }) public unitsRoot!: Laya.Sprite3D;
    @property({ type: Laya.Sprite }) public uiRoot!: Laya.Sprite;
    @property({ type: Laya.Label }) public timerLabel!: Laya.Label;
    @property({ type: Laya.Label }) public moneyLabel!: Laya.Label;
    @property({ type: Laya.Label }) public hintLabel!: Laya.Label;
    @property({ type: Laya.Sprite }) public cardPanel!: Laya.Sprite;
    @property({ type: Laya.Button }) public cardButtonA!: Laya.Button;
    @property({ type: Laya.Button }) public cardButtonB!: Laya.Button;
    @property({ type: Laya.Button }) public cardButtonC!: Laya.Button;
    @property({ type: Laya.Sprite }) public resultPanel!: Laya.Sprite;
    @property({ type: Laya.Label }) public resultTitle!: Laya.Label;
    @property({ type: Laya.Label }) public resultText!: Laya.Label;
    @property({ type: Laya.Button }) public ctaButton!: Laya.Button;
    @property({ type: Laya.Button }) public resultCtaButton!: Laya.Button;
    @property({ type: Laya.Sprite3D }) public playerBase!: Laya.Sprite3D;
    @property({ type: Laya.Sprite3D }) public enemyBase!: Laya.Sprite3D;
    @property({ type: String }) public soldierPrefabPath: string = "downloads/3d/soldier/Role_taikong_01.lh";
    @property({ type: String }) public dragonPrefabPath: string = "downloads/3d/dragon/Role_xiaohuangya_01.lh";
    @property({ type: String }) public towerPrefabPath: string = "downloads/3d/tower/SM_Prop_GuardTower_01.lh";
    @property({ type: String }) public barracksPrefabPath: string = "downloads/3d/barracks/SM_Bld_Military_Tent_03.lh";
    @property({ type: String }) public fireEffectPath: string = "downloads/3d/effects/FLame_red.lh";
    @property({ type: String }) public hitSoundPath: string = "downloads/2d/sfx/afedc1f409ba5418cc3ff2d6fdc64eca.mp3";
    @property({ type: String }) public bgmPath: string = "downloads/2d/bgm/f93f9377dcad12be63b55fcad314858d.mp3";
    @property({ type: Number }) public initialMoney: number = 20;
    @property({ type: Number }) public hexCost: number = 25;
    @property({ type: Number }) public timerCount: number = 80;
    @property({ type: Number }) public incomeInterval: number = 3;
    @property({ type: Number }) public spawnRate: number = 3;
    @property({ type: Number }) public redirectTouchCount: number = 5;
    @property({ type: Number }) public cameraVerticalSize: number = 16.5;
    @property({ type: Boolean }) public showDebugLayerLabels: boolean = false;

    private readonly cols: number = 7;
    private readonly rows: number = 10;
    private readonly tilesByKey: Map<string, Laya.MeshSprite3D> = new Map();
    private readonly debugLayerLabels: Laya.Label[] = [];
    private readonly units: BattleUnit[] = [];
    private readonly buildings: SpawnBuilding[] = [];
    private tiles: HexTileState[] = [];
    private money: number = 20;
    private remainingTime: number = 80;
    private incomeTimer: number = 0;
    private cardTimer: number = 0;
    private playerSpawnTimer: number = 0;
    private enemySpawnTimer: number = 0;
    private touchCount: number = 0;
    private firstClaim: boolean = true;
    private pausedForCards: boolean = false;
    private finished: boolean = false;
    private playerBaseHp: number = 100;
    private enemyBaseHp: number = 100;

    onAwake(): void {
        this.money = this.initialMoney;
        this.remainingTime = this.timerCount;
        this.tiles = createInitialHexGrid(this.cols, this.rows);
        this.cardPanel.visible = false;
        this.resultPanel.visible = false;
        this.setupCamera();
        this.buildBoard();
        this.refreshHud();
        this.bindUi();
        this.playBgm();
    }

    onUpdate(): void {
        const dt = Laya.timer.delta * 0.001;
        if (this.finished || this.pausedForCards) return;
        this.remainingTime = Math.max(0, this.remainingTime - dt);
        this.incomeTimer += dt;
        this.cardTimer += dt;
        this.playerSpawnTimer += dt;
        this.enemySpawnTimer += dt;
        if (this.incomeTimer >= this.incomeInterval) {
            this.incomeTimer = 0;
            this.money += calculateIncome(this.tiles, 3);
            this.refreshHud();
        }
        if (this.cardTimer >= 12) {
            this.cardTimer = 0;
            this.showCards();
        }
        if (this.playerSpawnTimer >= this.spawnRate) {
            this.playerSpawnTimer = 0;
            this.spawnUnit("player", this.hexToWorld(3, 8), false);
            for (const building of this.buildings) this.spawnUnit("player", building.position, building.kind === "dragon");
        }
        if (this.enemySpawnTimer >= this.spawnRate) {
            this.enemySpawnTimer = 0;
            this.spawnUnit("enemy", this.hexToWorld(3, 1), this.remainingTime < this.timerCount - 24);
        }
        this.updateUnits(dt);
        this.refreshHud();
        if (this.remainingTime <= 0 || this.enemyBaseHp <= 0 || this.playerBaseHp <= 0) this.finishGame(this.playerBaseHp > 0);
    }

    onDestroy(): void {
        this.uiRoot.off(Laya.Event.CLICK, this, this.onStageClick);
        this.cardButtonA.off(Laya.Event.CLICK, this, this.onPickArrowTower);
        this.cardButtonB.off(Laya.Event.CLICK, this, this.onPickBarracks);
        this.cardButtonC.off(Laya.Event.CLICK, this, this.onPickDragonNest);
        this.ctaButton.off(Laya.Event.CLICK, this, this.onCtaClick);
        this.resultCtaButton.off(Laya.Event.CLICK, this, this.onCtaClick);
        for (const label of this.debugLayerLabels) label.destroy();
        this.debugLayerLabels.length = 0;
        Laya.timer.clearAll(this);
    }

    private setupCamera(): void {
        const scene = this.owner.scene as Laya.Scene;
        const scene3D = scene.getChildByName("Scene3D") as Laya.Scene3D;
        const camera = scene3D?.getChildByName("Main Camera") as Laya.Camera;
        if (!camera) return;
        camera.orthographic = true;
        camera.orthographicVerticalSize = this.cameraVerticalSize;
        camera.transform.position = new Laya.Vector3(0, 22, 0.01);
        camera.transform.lookAt(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, -1), false, true);
        camera.clearColor = new Laya.Color(0.086, 0.71, 0.94, 1);
    }

    private buildBoard(): void {
        const mesh = Laya.PrimitiveMesh.createCylinder(0.82, 0.16, 6);
        for (const tile of this.tiles) {
            const node = new Laya.MeshSprite3D(mesh, `Hex_${tile.col}_${tile.row}`);
            node.meshRenderer.sharedMaterial = this.createMaterial(this.getTileColor(tile));
            node.transform.position = this.hexToWorld(tile.col, tile.row);
            node.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
            this.hexBoard.addChild(node);
            this.tilesByKey.set(this.key(tile.col, tile.row), node);
            if (this.showDebugLayerLabels) this.createDebugLayerLabel(tile);
        }
    }

    private createDebugLayerLabel(tile: HexTileState): void {
        const worldPos = this.hexToWorld(tile.col, tile.row);
        const label = new Laya.Label();
        label.name = `LayerLabel_${tile.col}_${tile.row}`;
        label.text = `L${tile.row}`;
        label.width = 50;
        label.height = 28;
        label.fontSize = 24;
        label.bold = true;
        label.align = "center";
        label.valign = "middle";
        label.color = "#111111";
        label.stroke = 4;
        label.strokeColor = "#FFFFFF";
        label.mouseEnabled = false;
        label.x = this.worldXToDebugLabelX(worldPos.x) - label.width * 0.5;
        label.y = this.worldZToDebugLabelY(worldPos.z) - label.height * 0.5;
        this.uiRoot.addChild(label);
        this.debugLayerLabels.push(label);
    }

    private bindUi(): void {
        this.uiRoot.on(Laya.Event.CLICK, this, this.onStageClick);
        this.cardButtonA.on(Laya.Event.CLICK, this, this.onPickArrowTower);
        this.cardButtonB.on(Laya.Event.CLICK, this, this.onPickBarracks);
        this.cardButtonC.on(Laya.Event.CLICK, this, this.onPickDragonNest);
        this.ctaButton.on(Laya.Event.CLICK, this, this.onCtaClick);
        this.resultCtaButton.on(Laya.Event.CLICK, this, this.onCtaClick);
    }

    private onStageClick(): void {
        this.touchCount++;
        if (this.touchCount >= this.redirectTouchCount) this.hintLabel.text = "点击立即下载，解锁完整战役";
        if (this.pausedForCards || this.finished) return;
        const tile = this.pickNearestTile(Laya.stage.mouseX, Laya.stage.mouseY);
        if (!tile) return;
        if (!canClaimTile(this.tiles, tile.col, tile.row, this.money, this.hexCost, this.firstClaim)) {
            this.hintLabel.text = this.money < this.hexCost ? "金币不足，等待收入" : "只能占领相邻中立地块";
            return;
        }
        this.tiles = claimTile(this.tiles, tile.col, tile.row);
        if (this.firstClaim) this.firstClaim = false;
        else this.money -= this.hexCost;
        this.updateTileVisual(tile.col, tile.row);
        this.hintLabel.text = "继续扩张，抵挡敌军！";
        this.refreshHud();
    }

    private showCards(): void {
        this.pausedForCards = true;
        this.cardPanel.visible = true;
        this.hintLabel.text = "选择一张卡牌强化防线";
    }

    private onPickArrowTower(): void { this.applyCard("arrowTower"); }
    private onPickBarracks(): void { this.applyCard("barracks"); }
    private onPickDragonNest(): void { this.applyCard("dragonNest"); }

    private applyCard(cardId: string): void {
        this.cardPanel.visible = false;
        this.pausedForCards = false;
        Laya.stage.event(GameEvents.CARD_SELECTED, { cardId });
        const position = this.findBuildPosition();
        if (cardId === "dragonNest") {
            this.money += 15;
            this.spawnUnit("player", position, true);
            this.createBuildingMarker(position, "dragon");
        } else if (cardId === "barracks") {
            this.createBuildingMarker(position, "barracks");
        } else {
            this.createBuildingMarker(position, "tower");
        }
        this.hintLabel.text = "防线已强化，观察兵线推进";
        this.refreshHud();
    }

    private createBuildingMarker(position: Laya.Vector3, kind: BuildingKind): void {
        const node = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(0.75, kind === "tower" ? 1.25 : 0.7, 0.75), `${kind}_${this.buildings.length}`);
        node.meshRenderer.sharedMaterial = this.createMaterial(kind === "dragon" ? "#FF6600" : kind === "tower" ? "#F8D34C" : "#82E03A");
        node.transform.position = new Laya.Vector3(position.x, 0.55, position.z);
        this.buildingsRoot.addChild(node);
        this.buildings.push({ kind, position: node.transform.position.clone() });
        if (kind === "tower") this.enemyBaseHp -= 8;
    }

    private spawnUnit(team: Team, position: Laya.Vector3, strong: boolean): void {
        const mesh = Laya.PrimitiveMesh.createCapsule(strong ? 0.35 : 0.24, strong ? 1.2 : 0.8);
        const node = new Laya.MeshSprite3D(mesh, `${team}_${strong ? "dragon" : "soldier"}_${this.units.length}`);
        node.meshRenderer.sharedMaterial = this.createMaterial(team === "player" ? "#4DEB7A" : "#FF3333");
        node.transform.position = new Laya.Vector3(position.x, 0.58, position.z);
        this.unitsRoot.addChild(node);
        this.units.push({ team, node, hp: strong ? 140 : team === "player" ? 40 : 100, damage: strong ? 16 : team === "player" ? 5 : 10, speed: strong ? 2.4 : team === "player" ? 3 : 2.8, attackCooldown: 0 });
    }

    private updateUnits(dt: number): void {
        for (let i = this.units.length - 1; i >= 0; i--) {
            const unit = this.units[i];
            if (unit.hp <= 0 || unit.node.destroyed) {
                unit.node.destroy();
                this.units.splice(i, 1);
                continue;
            }
            const opponent = this.findNearestOpponent(unit);
            unit.attackCooldown = Math.max(0, unit.attackCooldown - dt);
            if (opponent && Laya.Vector3.distance(unit.node.transform.position, opponent.node.transform.position) < 0.75) {
                if (unit.attackCooldown <= 0) {
                    opponent.hp -= unit.damage;
                    unit.attackCooldown = 0.7;
                    this.playHitSound();
                }
                continue;
            }
            const target = unit.team === "player" ? this.enemyBase.transform.position : this.playerBase.transform.position;
            if (Laya.Vector3.distance(unit.node.transform.position, target) < 1.1) {
                if (unit.team === "player") this.enemyBaseHp -= unit.damage * dt;
                else this.playerBaseHp -= unit.damage * dt;
                continue;
            }
            this.moveToward(unit.node, target, unit.speed * dt);
        }
    }

    private moveToward(node: Laya.Sprite3D, target: Laya.Vector3, step: number): void {
        const pos = node.transform.position;
        const dir = new Laya.Vector3(target.x - pos.x, 0, target.z - pos.z);
        const len = Math.max(0.001, Math.sqrt(dir.x * dir.x + dir.z * dir.z));
        node.transform.position = new Laya.Vector3(pos.x + dir.x / len * step, pos.y, pos.z + dir.z / len * step);
    }

    private findNearestOpponent(unit: BattleUnit): BattleUnit | null {
        let best: BattleUnit | null = null;
        let bestDistance = Number.MAX_VALUE;
        for (const other of this.units) {
            if (other.team === unit.team) continue;
            const distance = Laya.Vector3.distance(unit.node.transform.position, other.node.transform.position);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = other;
            }
        }
        return best;
    }

    private findBuildPosition(): Laya.Vector3 {
        const owned = this.tiles.filter((tile) => tile.owner === "player" && tile.kind !== "base");
        const tile = owned[owned.length - 1] ?? this.tiles.find((item) => item.owner === "player")!;
        return this.hexToWorld(tile.col, tile.row);
    }

    private pickNearestTile(stageX: number, stageY: number): HexTileState | null {
        const stageWidth = Math.max(1, Laya.stage.width);
        const stageHeight = Math.max(1, Laya.stage.height);
        const visibleHeight = this.cameraVerticalSize;
        const visibleWidth = visibleHeight * stageWidth / stageHeight;
        const normalizedX = (stageX / stageWidth - 0.5) * visibleWidth;
        const normalizedZ = (stageY / stageHeight - 0.5) * visibleHeight;
        let best: HexTileState | null = null;
        let bestDistance = Number.MAX_VALUE;
        for (const tile of this.tiles) {
            const pos = this.hexToWorld(tile.col, tile.row);
            const distance = Math.abs(pos.x - normalizedX) + Math.abs(pos.z - normalizedZ);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = tile;
            }
        }
        return best;
    }

    private updateTileVisual(col: number, row: number): void {
        const tile = this.tiles.find((item) => item.col === col && item.row === row);
        const node = this.tilesByKey.get(this.key(col, row));
        if (tile && node) node.meshRenderer.sharedMaterial = this.createMaterial(this.getTileColor(tile));
    }

    private refreshHud(): void {
        this.timerLabel.text = `${Math.ceil(this.remainingTime)}`;
        this.moneyLabel.text = `${Math.floor(this.money)}`;
        Laya.stage.event(GameEvents.MONEY_CHANGED, { money: this.money });
        Laya.stage.event(GameEvents.TIMER_CHANGED, { seconds: this.remainingTime });
    }

    private finishGame(victory: boolean): void {
        this.finished = true;
        this.resultPanel.visible = true;
        this.resultTitle.text = victory ? "领地守住了！" : "敌军压境！";
        this.resultText.text = victory ? "完整版解锁更多卡组与关卡" : "下载完整版继续挑战";
        Laya.stage.event(GameEvents.GAME_FINISHED, { victory });
    }

    private onCtaClick(): void {
        this.hintLabel.text = "正在打开商店...";
        console.log("Playable CTA redirect placeholder");
    }

    private playBgm(): void {
        if (this.bgmPath) Laya.SoundManager.playMusic(this.bgmPath, 0);
    }

    private playHitSound(): void {
        if (this.hitSoundPath) Laya.SoundManager.playSound(this.hitSoundPath, 1);
    }

    private hexToWorld(col: number, row: number): Laya.Vector3 {
        const x = (col - 3) * 1.42 + (row % 2 === 1 ? 0.71 : 0);
        const z = (row - 4.5) * 1.45;
        return new Laya.Vector3(x, 0, z);
    }

    private worldXToDebugLabelX(worldX: number): number {
        const width = this.uiRoot.width || Laya.stage.width || 1080;
        return (worldX / 9.8 + 0.5) * width;
    }

    private worldZToDebugLabelY(worldZ: number): number {
        const height = this.uiRoot.height || Laya.stage.height || 1920;
        return (worldZ / 16 + 0.48) * height;
    }

    private getTileColor(tile: HexTileState): string {
        if (tile.owner === "player") return "#82E03A";
        if (tile.owner === "enemy") return "#FF3333";
        if (tile.kind === "water") return "#3399FF";
        if (tile.kind === "lava") return "#FF6600";
        if (tile.kind === "void") return "#30343B";
        return "#C6C4C5";
    }

    private createMaterial(hex: string): Laya.BlinnPhongMaterial {
        const material = new Laya.BlinnPhongMaterial();
        material.albedoColor = this.colorFromHex(hex);
        return material;
    }

    private colorFromHex(hex: string): Laya.Color {
        const value = hex.replace("#", "");
        return new Laya.Color(parseInt(value.substring(0, 2), 16) / 255, parseInt(value.substring(2, 4), 16) / 255, parseInt(value.substring(4, 6), 16) / 255, 1);
    }

    private key(col: number, row: number): string {
        return `${col}_${row}`;
    }
}

type Team = "player" | "enemy";
type BuildingKind = "tower" | "barracks" | "dragon";

interface BattleUnit {
    team: Team;
    node: Laya.Sprite3D;
    hp: number;
    damage: number;
    speed: number;
    attackCooldown: number;
}

interface SpawnBuilding {
    kind: BuildingKind;
    position: Laya.Vector3;
}
