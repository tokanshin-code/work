import { GameEvents } from "../data/GameEvents";
import { HexTileState, calculateIncome, canClaimTile, claimTile, createInitialHexGrid } from "../data/HexRules";
import { SpawnCooldownState, createSpawnCooldown, tickSpawnCooldown } from "../data/SpawnCooldown";

const { regClass, property } = Laya;
const HEX_TILE_RADIUS = 0.82;
const HEX_TILE_HEIGHT = 0.32;
const HEX_OUTLINE_Y = 0.18;
const HEX_X_STEP = 1.42;
const HEX_ROW_X_OFFSET = 0.71;
const HEX_Z_STEP = 1.23;
const BUILDING_FOOTPRINT = 0.46;
const BASE_VISUAL_SCALE = 0.55;
const WATER_FLOOR_SIZE = 18;
const WATER_FLOOR_Y = -0.22;
const BUILDING_MAX_HP = 100;
const TOWER_ATTACK_RANGE = 3.2;
const TOWER_ATTACK_INTERVAL = 1.1;
const TOWER_DAMAGE = 12;

@regClass()
export class HexGameController extends Laya.Script {
    @property({ type: Laya.Sprite3D }) public hexBoard!: Laya.Sprite3D;
    @property({ type: Laya.Sprite3D }) public waterLayer?: Laya.Sprite3D;
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
    @property({ type: String }) public waterTexturePath: string = "resources/water/water_surface.png";
    @property({ type: Number }) public initialMoney: number = 20;
    @property({ type: Number }) public hexCost: number = 25;
    @property({ type: Number }) public timerCount: number = 80;
    @property({ type: Number }) public incomeInterval: number = 3;
    @property({ type: Number }) public spawnRate: number = 3;
    @property({ type: Number }) public redirectTouchCount: number = 5;
    @property({ type: Number }) public goldSupplyAmount: number = 35;
    @property({ type: Number }) public cameraVerticalSize: number = 15.6;
    @property({ type: Boolean }) public showDebugLayerLabels: boolean = false;

    private readonly cardDeck: CardId[] = ["arrowTower", "barracks", "goldSupply", "dragonNest"];
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
    private nextCardStart: number = 0;
    private activeCardChoices: CardId[] = ["arrowTower", "barracks", "goldSupply"];
    private gameStarted: boolean = false;
    private touchCount: number = 0;
    private firstClaim: boolean = true;
    private pausedForCards: boolean = false;
    private suppressNextStageClick: boolean = false;
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
        this.createWaterFloor();
        this.buildBoard();
        this.setupBases();
        this.refreshHud();
        this.bindUi();
        this.hintLabel.text = "点击方块建造据点，开始战斗";
        this.playBgm();
    }

    onUpdate(): void {
        const dt = Laya.timer.delta * 0.001;
        if (this.finished || this.pausedForCards) return;
        if (!this.gameStarted) {
            this.refreshHud();
            return;
        }
        this.remainingTime = Math.max(0, this.remainingTime - dt);
        this.incomeTimer += dt;
        if (this.incomeTimer >= this.incomeInterval) {
            this.incomeTimer = 0;
            this.money += calculateIncome(this.tiles, 3);
            this.refreshHud();
        }
        this.updateBuildingSpawns(dt);
        this.updateTowerAttacks(dt);
        this.updateUnits(dt);
        this.refreshHud();
        if (this.remainingTime <= 0 || this.enemyBaseHp <= 0 || this.playerBaseHp <= 0) this.finishGame(this.playerBaseHp > 0);
    }

    onDestroy(): void {
        this.uiRoot.off(Laya.Event.CLICK, this, this.onStageClick);
        this.cardButtonA.off(Laya.Event.CLICK, this, this.onPickCardA);
        this.cardButtonB.off(Laya.Event.CLICK, this, this.onPickCardB);
        this.cardButtonC.off(Laya.Event.CLICK, this, this.onPickCardC);
        this.ctaButton.off(Laya.Event.CLICK, this, this.onCtaClick);
        this.resultCtaButton.off(Laya.Event.CLICK, this, this.onCtaClick);
        for (const label of this.debugLayerLabels) label.destroy();
        this.debugLayerLabels.length = 0;
        for (const building of this.buildings) building.progressSprite.destroy();
        Laya.timer.clearAll(this);
    }

    private setupCamera(): void {
        const camera = this.getMainCamera();
        if (!camera) return;
        camera.orthographic = true;
        camera.orthographicVerticalSize = this.cameraVerticalSize;
        camera.transform.position = new Laya.Vector3(0, 22, 0.01);
        camera.transform.rotationEuler = new Laya.Vector3(-90, 0, 0);
        camera.clearColor = new Laya.Color(0.086, 0.71, 0.94, 1);
    }

    private getMainCamera(): Laya.Camera | null {
        const scene3D = this.getScene3D();
        return scene3D?.getChildByName("Main Camera") as Laya.Camera ?? null;
    }

    private getScene3D(): Laya.Scene3D | null {
        const ownerScene = this.owner.scene as Laya.Node;
        if (!ownerScene) return null;
        if (ownerScene.getChildByName("Main Camera")) return ownerScene as Laya.Scene3D;
        return ownerScene.getChildByName("Scene3D") as Laya.Scene3D ?? null;
    }

    private buildBoard(): void {
        for (const tile of this.tiles) {
            const node = this.createHexTileNode(tile);
            this.hexBoard.addChild(node);
            this.tilesByKey.set(this.key(tile.col, tile.row), node);
            if (this.showDebugLayerLabels) this.createDebugLayerLabel(tile);
        }
    }

    private createWaterFloor(): void {
        const water = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createPlane(WATER_FLOOR_SIZE, WATER_FLOOR_SIZE, 1, 1), "WaterFloor");
        const material = new Laya.UnlitMaterial();
        material.albedoColor = this.colorFromHex("#2AA7D8");
        material.albedoIntensity = 1.05;
        material.tilingOffset = new Laya.Vector4(4, 4, 0, 0);
        water.meshRenderer.sharedMaterial = material;
        water.transform.position = new Laya.Vector3(0, WATER_FLOOR_Y, 0);
        this.getWaterLayer().addChild(water);
        void Laya.loader.load(this.waterTexturePath, Laya.Loader.TEXTURE2D).then((texture: Laya.Texture2D | null) => {
            if (texture && !water.destroyed) material.albedoTexture = texture as Laya.BaseTexture;
        });
    }

    private getWaterLayer(): Laya.Sprite3D {
        if (this.waterLayer) return this.waterLayer;
        const scene3D = this.getScene3D();
        if (!scene3D) return this.hexBoard;
        let layer = scene3D.getChildByName("WaterLayer") as Laya.Sprite3D;
        if (!layer) {
            layer = new Laya.Sprite3D("WaterLayer");
            scene3D.addChild(layer);
        }
        this.waterLayer = layer;
        return layer;
    }

    private createHexTileNode(tile: HexTileState): Laya.MeshSprite3D {
        const node = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createCylinder(HEX_TILE_RADIUS, HEX_TILE_HEIGHT, 6), `Hex_${tile.col}_${tile.row}`);
        node.meshRenderer.sharedMaterial = this.createMaterial(this.getTileColor(tile));
        node.transform.position = this.hexToWorld(tile.col, tile.row);
        node.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
        node.addChild(this.createHexOutline(tile));
        return node;
    }

    private createHexOutline(tile: HexTileState): Laya.PixelLineSprite3D {
        const outline = new Laya.PixelLineSprite3D(6, `HexOutline_${tile.col}_${tile.row}`);
        const color = this.colorFromHex("#26323A");
        const points: Laya.Vector3[] = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            points.push(new Laya.Vector3(Math.cos(angle) * HEX_TILE_RADIUS, HEX_OUTLINE_Y, Math.sin(angle) * HEX_TILE_RADIUS));
        }
        for (let i = 0; i < 6; i++) {
            outline.addLine(points[i], points[(i + 1) % 6], color, color);
        }
        return outline;
    }

    private setupBases(): void {
        this.placeBaseOnTile(this.playerBase, 3, 8);
        this.placeBaseOnTile(this.enemyBase, 3, 1);
        this.playerBase.active = false;
        this.enemyBase.active = false;
    }

    private placeBaseOnTile(base: Laya.Sprite3D, col: number, row: number): void {
        const tilePos = this.hexToWorld(col, row);
        base.transform.position = new Laya.Vector3(tilePos.x, 0.2, tilePos.z);
        base.transform.localScale = new Laya.Vector3(BASE_VISUAL_SCALE, BASE_VISUAL_SCALE, BASE_VISUAL_SCALE);
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
        this.cardButtonA.on(Laya.Event.CLICK, this, this.onPickCardA);
        this.cardButtonB.on(Laya.Event.CLICK, this, this.onPickCardB);
        this.cardButtonC.on(Laya.Event.CLICK, this, this.onPickCardC);
        this.ctaButton.on(Laya.Event.CLICK, this, this.onCtaClick);
        this.resultCtaButton.on(Laya.Event.CLICK, this, this.onCtaClick);
    }

    private onStageClick(): void {
        if (this.suppressNextStageClick) {
            this.suppressNextStageClick = false;
            return;
        }
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
        if (!this.gameStarted) {
            this.startBattleFromTile(tile);
        } else {
            this.hintLabel.text = "继续扩张，抵挡敌军！";
        }
        this.showCards();
        this.refreshHud();
    }

    private startBattleFromTile(tile: HexTileState): void {
        this.gameStarted = true;
        const playerPosition = this.hexToWorld(tile.col, tile.row);
        this.activateInitialBase(this.playerBase, playerPosition, "player");
        this.activateInitialBase(this.enemyBase, this.hexToWorld(3, 1), "enemy");
        this.hintLabel.text = "据点已建成，士兵正在集结！";
    }

    private activateInitialBase(base: Laya.Sprite3D, position: Laya.Vector3, team: Team): void {
        base.active = true;
        base.transform.position = new Laya.Vector3(position.x, 0.2, position.z);
        base.transform.localScale = new Laya.Vector3(BASE_VISUAL_SCALE, BASE_VISUAL_SCALE, BASE_VISUAL_SCALE);
        const progressSprite = this.createSpawnProgressSprite(base.transform.position, team);
        this.buildings.push({ kind: "barracks", team, position: base.transform.position.clone(), cooldown: createSpawnCooldown(this.spawnRate), progressSprite, hp: BUILDING_MAX_HP, attackCooldown: 0, node: base });
    }

    private showCards(): void {
        this.pausedForCards = true;
        this.activeCardChoices = this.createCardChoices();
        this.cardButtonA.label = this.getCardLabel(this.activeCardChoices[0]);
        this.cardButtonB.label = this.getCardLabel(this.activeCardChoices[1]);
        this.cardButtonC.label = this.getCardLabel(this.activeCardChoices[2]);
        this.cardPanel.visible = true;
        this.hintLabel.text = "选择一张卡牌强化防线";
    }

    private createCardChoices(): CardId[] {
        const choices = [0, 1, 2].map((offset) => this.cardDeck[(this.nextCardStart + offset) % this.cardDeck.length]);
        this.nextCardStart = (this.nextCardStart + 1) % this.cardDeck.length;
        return choices;
    }

    private getCardLabel(cardId: CardId): string {
        if (cardId === "arrowTower") return "箭塔";
        if (cardId === "barracks") return "兵营";
        if (cardId === "goldSupply") return "金币补给";
        return "龙巢";
    }

    private onPickCardA(): void { this.applyCard(this.activeCardChoices[0]); }
    private onPickCardB(): void { this.applyCard(this.activeCardChoices[1]); }
    private onPickCardC(): void { this.applyCard(this.activeCardChoices[2]); }

    private applyCard(cardId: CardId): void {
        this.suppressNextStageClick = true;
        this.cardPanel.visible = false;
        this.pausedForCards = false;
        Laya.stage.event(GameEvents.CARD_SELECTED, { cardId });
        const position = this.findBuildPosition();
        if (cardId === "goldSupply") {
            this.money += this.goldSupplyAmount;
        } else if (cardId === "dragonNest") {
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

    private createSpawnProgressSprite(position: Laya.Vector3, team: Team): Laya.Sprite {
        const sprite = new Laya.Sprite();
        sprite.name = `${team}_SpawnProgress_${this.buildings.length}`;
        sprite.mouseEnabled = false;
        this.uiRoot.addChild(sprite);
        this.positionProgressSprite(sprite, position);
        return sprite;
    }

    private createBuildingMarker(position: Laya.Vector3, kind: BuildingKind, team: Team = "player"): void {
        const node = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(BUILDING_FOOTPRINT, kind === "tower" ? 0.95 : 0.56, BUILDING_FOOTPRINT), `${team}_${kind}_${this.buildings.length}`);
        const color = team === "enemy" ? "#FF3333" : kind === "dragon" ? "#FF6600" : kind === "tower" ? "#F8D34C" : "#82E03A";
        node.meshRenderer.sharedMaterial = this.createMaterial(color);
        node.transform.position = new Laya.Vector3(position.x, kind === "tower" ? 0.64 : 0.42, position.z);
        this.buildingsRoot.addChild(node);
        const progressSprite = this.createSpawnProgressSprite(node.transform.position, team);
        this.buildings.push({ kind, team, position: node.transform.position.clone(), cooldown: createSpawnCooldown(this.spawnRate), progressSprite, hp: BUILDING_MAX_HP, attackCooldown: 0, node });
    }

    private spawnUnit(team: Team, position: Laya.Vector3, strong: boolean): void {
        const mesh = Laya.PrimitiveMesh.createCapsule(strong ? 0.35 : 0.24, strong ? 1.2 : 0.8);
        const node = new Laya.MeshSprite3D(mesh, `${team}_${strong ? "dragon" : "soldier"}_${this.units.length}`);
        node.meshRenderer.sharedMaterial = this.createMaterial(team === "player" ? "#4DEB7A" : "#FF3333");
        node.transform.position = new Laya.Vector3(position.x, 0.58, position.z);
        this.unitsRoot.addChild(node);
        this.units.push({ team, node, hp: strong ? 140 : team === "player" ? 40 : 100, damage: strong ? 16 : team === "player" ? 5 : 10, speed: strong ? 2.4 : team === "player" ? 3 : 4, attackCooldown: 0 });
    }

    private updateBuildingSpawns(dt: number): void {
        for (const building of this.buildings) {
            if (building.kind === "tower") continue;
            const result = tickSpawnCooldown(building.cooldown, dt, this.gameStarted && !this.pausedForCards && !this.finished);
            building.cooldown = result.state;
            for (let i = 0; i < result.spawnCount; i++) {
                const strong = building.kind === "dragon" || (building.team === "enemy" && this.remainingTime < this.timerCount - 24);
                this.spawnUnit(building.team, building.position, strong);
            }
            this.drawSpawnProgress(building);
        }
    }

    private updateTowerAttacks(dt: number): void {
        for (const building of this.buildings) {
            if (building.kind !== "tower" || building.team !== "player" || building.hp <= 0) continue;
            building.attackCooldown = Math.max(0, building.attackCooldown - dt);
            if (building.attackCooldown > 0) continue;
            const target = this.findNearestOpponentUnit(building.team, building.position, TOWER_ATTACK_RANGE);
            if (!target) continue;
            target.hp -= TOWER_DAMAGE;
            building.attackCooldown = TOWER_ATTACK_INTERVAL;
            this.playHitSound();
        }
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
        return this.findNearestOpponentUnit(unit.team, unit.node.transform.position);
    }

    private findNearestOpponentUnit(team: Team, position: Laya.Vector3, maxRange: number = Number.MAX_VALUE): BattleUnit | null {
        let best: BattleUnit | null = null;
        let bestDistance = Number.MAX_VALUE;
        for (const other of this.units) {
            if (other.team === team) continue;
            const distance = Laya.Vector3.distance(position, other.node.transform.position);
            if (distance <= maxRange && distance < bestDistance) {
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
        const boardPoint = this.screenToBoardPoint(stageX, stageY);
        if (!boardPoint) return null;
        let best: HexTileState | null = null;
        let bestDistance = Number.MAX_VALUE;
        for (const tile of this.tiles) {
            const pos = this.hexToWorld(tile.col, tile.row);
            const distance = Math.abs(pos.x - boardPoint.x) + Math.abs(pos.z - boardPoint.z);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = tile;
            }
        }
        return best;
    }

    private screenToBoardPoint(stageX: number, stageY: number): Laya.Vector3 | null {
        const camera = this.getMainCamera();
        if (!camera) return null;
        const ray = new Laya.Ray(new Laya.Vector3(), new Laya.Vector3());
        camera.viewportPointToRay(new Laya.Vector2(stageX, stageY), ray);
        const boardPlane = new Laya.Plane(new Laya.Vector3(0, 1, 0), 0);
        const hit = new Laya.Vector3();
        return Laya.CollisionUtils.intersectsRayAndPlaneRP(ray, boardPlane, hit) ? hit : null;
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
        this.suppressNextStageClick = true;
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
        const x = (col - 3) * HEX_X_STEP + (row % 2 === 1 ? HEX_ROW_X_OFFSET : 0);
        const z = (row - 4.5) * HEX_Z_STEP;
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

    private positionProgressSprite(sprite: Laya.Sprite, position: Laya.Vector3): void {
        sprite.x = this.worldXToDebugLabelX(position.x);
        sprite.y = this.worldZToDebugLabelY(position.z) - 38;
    }

    private drawSpawnProgress(building: SpawnBuilding): void {
        const sprite = building.progressSprite;
        this.positionProgressSprite(sprite, building.position);
        sprite.graphics.clear();
        const radius = 22;
        const fillColor = building.team === "player" ? "#E9FF7A" : "#FFB0A8";
        sprite.graphics.drawCircle(0, 0, radius, "rgba(0,0,0,0.35)");
        sprite.graphics.drawPie(0, 0, radius - 4, -90, -90 + building.cooldown.progress * 360, fillColor);
        sprite.graphics.drawCircle(0, 0, radius - 11, "rgba(22,181,240,0.85)");
    }

    private getTileColor(tile: HexTileState): string {
        if (tile.owner === "player") return "#82E03A";
        if (tile.owner === "enemy") return "#FF3333";
        if (tile.kind === "water") return "#3399FF";
        if (tile.kind === "lava") return "#FF6600";
        if (tile.kind === "void") return "#30343B";
        return "#C6C4C5";
    }

    private createMaterial(hex: string): Laya.UnlitMaterial {
        const material = new Laya.UnlitMaterial();
        material.albedoColor = this.colorFromHex(hex);
        material.albedoIntensity = 1.15;
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
type CardId = "arrowTower" | "barracks" | "goldSupply" | "dragonNest";

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
    team: Team;
    position: Laya.Vector3;
    cooldown: SpawnCooldownState;
    progressSprite: Laya.Sprite;
    hp: number;
    attackCooldown: number;
    node: Laya.Sprite3D;
}
