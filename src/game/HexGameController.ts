import { GameEvents } from "../data/GameEvents";
import { HexTileState, calculateIncome, canClaimTile, claimTile, createInitialHexGrid, isAdjacent } from "../data/HexRules";
import { SpawnCooldownState, createSpawnCooldown, tickSpawnCooldown } from "../data/SpawnCooldown";

const { regClass, property } = Laya;
const HEX_TILE_RADIUS = 0.82;
const HEX_TILE_HEIGHT = 0.32;
const HEX_OUTLINE_Y = 0.18;
const HEX_TILE_GAP = 0.048;
const GROUND_SURFACE_Y = HEX_TILE_HEIGHT * 0.5;
const MODEL_BASE_Y = GROUND_SURFACE_Y + 0.04;
const HEX_X_STEP = 1.47;
const HEX_ROW_X_OFFSET = 0.735;
const HEX_Z_STEP = 1.273;
const HEX_ROW_ELEVATION_STEP = 0.045;
const BUILDING_FOOTPRINT = 0.62;
const BASE_VISUAL_SCALE = 0.45;
const MODEL_TILE_SCALE_CAP = 0.42;
const MODEL_FOOTPRINT_LIMIT = HEX_TILE_RADIUS * 1.15;
const BUILDING_FOOTPRINT_LIMIT = HEX_TILE_RADIUS * 1.35;
const UNIT_FOOTPRINT_LIMIT = HEX_TILE_RADIUS * 0.58;
const OPENING_TILE_COL = 3;
const OPENING_TILE_ROW = 8;
const WATER_FLOOR_SIZE = 18;
const WATER_FLOOR_Y = -0.22;
const BUILDING_MAX_HP = 100;
const TOWER_ATTACK_RANGE = 3.2;
const TOWER_ATTACK_INTERVAL = 1.1;
const TOWER_DAMAGE = 12;
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;
const BASE_HP_MAX = 100;
const SPAWN_PROGRESS_SIZE = 44;
const SPAWN_PROGRESS_FILL_MASK_RADIUS = SPAWN_PROGRESS_SIZE * 0.46;
const UNIT_HP_BAR_WIDTH = 120;
const UNIT_HP_BAR_HEIGHT = 22;
const BUILDING_HP_BAR_WIDTH = 168;
const BUILDING_HP_BAR_HEIGHT = 26;
const UNIT_VISUAL_Y_OFFSET = 0.56;
const UNIT_SPAWN_FORWARD_OFFSET = 0.62;
const MIN_BATTLE_RESULT_DELAY = 8;
const TILE_UNLOCK_FLIGHT_HEIGHT = 1.35;
const TILE_UNLOCK_ROTATION_DEGREES = 720;
const TILE_UNLOCK_LAUNCH_MS = 180;
const TILE_UNLOCK_SPIN_MS = 420;
const TILE_UNLOCK_LAND_MS = 160;
const VICTORY_SPREAD_STEP_MS = 150;
const TILE_PAINT_COOLDOWN_MS = 160;
const COLOR_WATER = "#7FE6FF";
const COLOR_NEUTRAL_TILE = "#BDBDBD";
const COLOR_PLAYER_TILE = "#97DD3E";
const COLOR_ENEMY_TILE = "#C93D42";
const COLOR_TILE_SIDE = "#8B8B8B";
const COLOR_TILE_OUTLINE = "#9A9A9A";
const COLOR_LAVA_TILE = "#F47B22";
const COLOR_VOID_TILE = "#50555A";
const RESULT_PANEL_ART_LAYER = "ResultPanelVectorArt";
const RESULT_PANEL_BADGE_LAYER = "ResultPanelBadge";
const RESULT_PANEL_HEX_STRIP_LAYER = "ResultPanelHexStrip";
const RESULT_PANEL_CTA_ART_LAYER = "ResultPanelCtaArt";
const RESULT_PANEL_DARK = "#123F55";
const RESULT_PANEL_SHADOW = "#0A2B3B";
const RESULT_PANEL_CREAM = "#FFF7D6";
const RESULT_PANEL_GOLD = "#FFCF3D";
const RESULT_PANEL_ORANGE = "#FF7A1A";
const RESULT_PANEL_GREEN = "#82E03A";
const RESULT_PANEL_RED = "#FF3333";

type UiMode = "tutorial" | "battle" | "cardChoice" | "result";

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
    @property({ type: Laya.Sprite3D }) public defaultClickableTileMarker?: Laya.Sprite3D;
    @property({ type: Laya.Sprite3D }) public initialBuildSlot?: Laya.Sprite3D;
    @property({ type: Laya.Sprite }) public unlockCostLayer?: Laya.Sprite;
    @property({ type: String }) public soldierPrefabPath: string = "downloads/3d/soldier/Role_taikong_01.lh";
    @property({ type: String }) public dragonPrefabPath: string = "downloads/3d/dragon/Role_xiaohuangya_01.lh";
    @property({ type: String }) public towerPrefabPath: string = "match/Models/GLB format/building-archery-unpacked/building-archery.lh";
    @property({ type: String }) public barracksPrefabPath: string = "match/Models/GLB format/building-cabin-unpacked/building-cabin.lh";
    @property({ type: String }) public dragonNestPrefabPath: string = "match/Models/GLB format/building-wizard-tower-unpacked/building-wizard-tower.lh";
    @property({ type: String }) public baseBuildingPrefabPath: string = "match/Models/GLB format/building-castle-unpacked/building-castle.lh";
    @property({ type: String }) public fireEffectPath: string = "downloads/3d/effects/FLame_red.lh";
    @property({ type: String }) public hitSoundPath: string = "downloads/2d/sfx/afedc1f409ba5418cc3ff2d6fdc64eca.mp3";
    @property({ type: String }) public bgmPath: string = "downloads/2d/bgm/f93f9377dcad12be63b55fcad314858d.mp3";
    @property({ type: String }) public waterTexturePath: string = "resources/water/water_surface.png";
    @property({ type: String }) public hexTilePrefabPath: string = "match/Models/GLB format/grass.glb";
    @property({ type: String }) public cardPanelSkinPath: string = "downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png";
    @property({ type: String }) public cardOptionSkinPath: string = "downloads/2d/card_option/CardFrame_01_White_Bg.png";
    @property({ type: String }) public resultPanelSkinPath: string = "downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png";
    @property({ type: String }) public tutorialHintSkinPath: string = "downloads/2d/tutorial_hint/info.png";
    @property({ type: String }) public coinIconPath: string = "downloads/2d/ui/coin_2.png";
    @property({ type: String }) public cardIconPath: string = "downloads/2d/ui/card.png";
    @property({ type: String }) public handIconPath: string = "downloads/2d/ui/hand.png";
    @property({ type: String }) public spawnProgressBgPath: string = "resources/ui/spawn_progress_bg.png";
    @property({ type: String }) public spawnProgressRingPath: string = "resources/ui/spawn_progress_ring.png";
    @property({ type: Number }) public initialMoney: number = 20;
    @property({ type: Number }) public hexCost: number = 25;
    @property({ type: Number }) public timerCount: number = 80;
    @property({ type: Number }) public incomeInterval: number = 3;
    @property({ type: Number }) public spawnRate: number = 3;
    @property({ type: Number }) public resourceRate: number = 1.5;
    @property({ type: Number }) public spearBarracksRate: number = 3;
    @property({ type: Number }) public archerBarracksRate: number = 3;
    @property({ type: Number }) public cavalryBarracksRate: number = 3;
    @property({ type: Number }) public redirectTouchCount: number = 5;
    @property({ type: Number }) public goldSupplyAmount: number = 35;
    @property({ type: Number }) public buildingModelScale: number = 0.38;
    @property({ type: Number }) public baseBuildingModelScale: number = 0.38;
    @property({ type: Number }) public towerModelScale: number = 0.38;
    @property({ type: Number }) public barracksModelScale: number = 0.38;
    @property({ type: Number }) public dragonNestModelScale: number = 0.38;
    @property({ type: Number }) public soldierModelScale: number = 0.22;
    @property({ type: Number }) public bossModelScale: number = 0.2;
    @property({ type: Number }) public tileModelScale: number = 0.42;
    @property({ type: Boolean }) public enableProjectedShadows: boolean = true;
    @property({ type: Number }) public shadowDistance: number = 24;
    @property({ type: Number }) public shadowStrength: number = 0.72;
    @property({ type: Number }) public shadowResolution: number = 1024;
    @property({ type: Boolean }) public showDebugLayerLabels: boolean = false;

    private readonly defenseCards: CardId[] = ["arrowTower"];
    private readonly resourceCards: CardId[] = ["goldMine"];
    private readonly unitCards: CardId[] = ["spearBarracks", "archerBarracks", "cavalryBarracks"];
    private readonly enemyOpeningBuildings: BuildingKind[] = ["spearBarracks", "archerBarracks", "cavalryBarracks"];
    private readonly cols: number = 7;
    private readonly rows: number = 10;
    private readonly tilesByKey: Map<string, Laya.MeshSprite3D> = new Map();
    private readonly tilePaintCooldowns: Map<string, number> = new Map();
    private readonly debugLayerLabels: Laya.Label[] = [];
    private readonly unlockCostLabels: Laya.Sprite[] = [];
    private readonly units: BattleUnit[] = [];
    private readonly buildings: SpawnBuilding[] = [];
    private tiles: HexTileState[] = [];
    private money: number = 20;
    private remainingTime: number = 80;
    private incomeTimer: number = 0;
    private nextUnitCardStart: number = 0;
    private nextEnemyBuildingIndex: number = 0;
    private activeCardChoices: CardId[] = ["arrowTower", "goldMine", "spearBarracks"];
    private gameStarted: boolean = false;
    private touchCount: number = 0;
    private firstClaim: boolean = true;
    private pausedForCards: boolean = false;
    private suppressNextStageClick: boolean = false;
    private finished: boolean = false;
    private playerBaseHp: number = 100;
    private enemyBaseHp: number = 100;
    private battleElapsed: number = 0;
    private pendingInitialBuildPosition: Laya.Vector3 | null = null;
    private unlockCostFocusTile: HexTileState | null = null;
    private walletCoinIcon?: Laya.Image;
    private firstTapHighlight?: Laya.Sprite;
    private firstTapHand?: Laya.Image;
    private playerHpBar?: Laya.Sprite;
    private enemyHpBar?: Laya.Sprite;
    private uiLayers?: UiLayers;
    private uiMode: UiMode = "tutorial";
    private readonly runtimePrefabPathMap: Record<string, string> = {
        "match/绑定动画/SW_NPC_000_通用/SW_NPC_008_士兵@skin.fbx": "match/绑定动画/SW_NPC_000_通用/SW_NPC_008_士兵@skin.lh",
        "match/模型资产/建筑/building_058_FGH_主塔/building_058_FGH_Tower.fbx": "match/Models/GLB format/building-archery-unpacked/building-archery.lh",
        "match/模型资产/建筑/building_056_主楼/building_056_zhulou.fbx": "match/Models/GLB format/building-cabin-unpacked/building-cabin.lh",
        "match/模型资产/建筑/building_045_FGH_主楼/building_045_FGH_Main.fbx": "match/Models/GLB format/building-castle-unpacked/building-castle.lh",
        "match/3月新增资源/丧尸/Boss.fbx": "downloads/3d/dragon/Role_xiaohuangya_01.lh",
    };

    onAwake(): void {
        this.money = this.initialMoney;
        this.remainingTime = this.timerCount;
        this.tiles = createInitialHexGrid(this.cols, this.rows);
        this.firstClaim = false;
        this.cardPanel.visible = false;
        this.resultPanel.visible = false;
        this.ctaButton.visible = false;
        this.setupCamera();
        this.setupLighting();
        this.createWaterFloor();
        this.buildBoard();
        this.setupUiLayers();
        this.setupEditorHierarchyHelpers();
        this.hideEditorAssetSamples();
        this.setupBases();
        this.applyUiSkins();
        this.applyReferenceUiLayout();
        this.refreshHud();
        this.updateHpBars();
        this.setUiMode("tutorial");
        this.bindUi();
        this.showOpeningBuildChoice();
        this.playBgm();
    }

    onUpdate(): void {
        const dt = Math.min(Laya.timer.delta * 0.001, 0.1);
        if (this.finished || this.pausedForCards) return;
        if (!this.gameStarted) {
            this.refreshHud();
            return;
        }
        this.battleElapsed += dt;
        this.remainingTime = Math.max(0, this.remainingTime - dt);
        this.incomeTimer += dt;
        if (this.incomeTimer >= this.incomeInterval) {
            this.incomeTimer = 0;
            this.money += this.calculatePeriodicIncome();
            this.updateUnlockCostLabels();
            this.refreshHud();
        }
        this.updateBuildingSpawns(dt);
        this.updateTowerAttacks(dt);
        this.updateUnits(dt);
        this.removeDestroyedBuildings();
        this.updateBuildingHpBars();
        this.updateUnitHpBars();
        this.updateHpBars();
        this.refreshHud();
        if (this.battleElapsed >= MIN_BATTLE_RESULT_DELAY && this.resolveBuildingElimination()) return;
        if (this.remainingTime <= 0 && this.resolveTimedVictory()) return;
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
        this.clearUnlockCostLabels();
        this.walletCoinIcon?.destroy();
        this.firstTapHighlight?.destroy();
        this.firstTapHand?.destroy();
        this.playerHpBar?.destroy();
        this.enemyHpBar?.destroy();
        for (const building of this.buildings) {
            building.progressSprite.destroy();
            building.hpBar.destroy();
        }
        for (const unit of this.units) unit.hpBar.destroy();
        Laya.timer.clearAll(this);
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

    private setupCamera(): void {
        const camera = this.getMainCamera();
        if (!camera) return;
        camera.orthographic = false;
        camera.fieldOfView = 42;
        camera.nearPlane = 0.3;
        camera.farPlane = 1000;
        camera.clearColor = this.colorFromHex(COLOR_WATER);
        camera.transform.position = new Laya.Vector3(0, 21.2, 10.6);
        camera.transform.rotationEuler = new Laya.Vector3(-66, 0, 0);
    }

    private setupLighting(): void {
        const scene3D = this.getScene3D() as (Laya.Scene3D & { ambientColor?: Laya.Color }) | null;
        if (scene3D) scene3D.ambientColor = new Laya.Color(0.62, 0.68, 0.72, 1);
        const lightNode = scene3D?.getChildByName("Direction Light") as Laya.Sprite3D | null;
        const light = lightNode?.getComponent(Laya.DirectionLightCom) as (Laya.DirectionLightCom & { intensity?: number }) | null;
        if (!light) return;
        light.color = new Laya.Color(1, 0.95, 0.82, 1);
        light.intensity = 1.6;
        light.direction = new Laya.Vector3(-1.05, -0.28, -0.72);
        this.configureProjectedShadows(light);
    }

    private configureProjectedShadows(): void;
    private configureProjectedShadows(light: Laya.DirectionLightCom & { shadowDistance?: number; shadowStrength?: number; shadowResolution?: number }): void;
    private configureProjectedShadows(light?: Laya.DirectionLightCom & { shadowDistance?: number; shadowStrength?: number; shadowResolution?: number }): void {
        if (!light) return;
        if (!this.enableProjectedShadows) {
            light.shadowMode = Laya.ShadowMode.None;
            return;
        }
        light.shadowMode = Laya.ShadowMode.SoftLow;
        light.shadowDistance = this.shadowDistance;
        light.shadowStrength = this.shadowStrength;
        light.shadowResolution = this.shadowResolution;
    }

    private buildBoard(): void {
        for (const tile of this.tiles) {
            const node = this.createHexTileNode(tile);
            this.hexBoard.addChild(node);
            this.tilesByKey.set(this.key(tile.col, tile.row), node);
            if (this.showDebugLayerLabels) this.createDebugLayerLabel(tile);
        }
    }

    private setupEditorHierarchyHelpers(): void {
        this.defaultClickableTileMarker = this.getOrCreateSprite3D(this.hexBoard, "DefaultClickableTileMarker", this.defaultClickableTileMarker);
        this.initialBuildSlot = this.getOrCreateSprite3D(this.buildingsRoot, "InitialBuildSlot", this.initialBuildSlot);
        this.unlockCostLayer = this.getOrCreateUnlockCostLayer();
        this.setupDefaultClickableTileMarker();
        this.unlockCostFocusTile = this.tiles.find((tile) => tile.col === OPENING_TILE_COL && tile.row === OPENING_TILE_ROW) ?? null;
        this.clearUnlockCostLabels();
    }

    private hideEditorAssetSamples(): void {
        const samples = this.getScene3D()?.getChildByName("EditorAssetSamples") as Laya.Sprite3D | null;
        if (samples) samples.active = false;
    }

    private getOrCreateSprite3D(parent: Laya.Sprite3D, name: string, existing?: Laya.Sprite3D): Laya.Sprite3D {
        if (existing && !existing.destroyed) return existing;
        let node = parent.getChildByName(name) as Laya.Sprite3D;
        if (!node) {
            node = new Laya.Sprite3D(name);
            parent.addChild(node);
        }
        return node;
    }

    private getOrCreateUnlockCostLayer(): Laya.Sprite {
        if (this.unlockCostLayer && !this.unlockCostLayer.destroyed) return this.unlockCostLayer;
        const parent = this.uiLayers?.worldOverlay ?? this.uiRoot;
        let layer = parent.getChildByName("UnlockCostLayer") as Laya.Sprite;
        if (!layer) {
            layer = new Laya.Sprite();
            layer.name = "UnlockCostLayer";
            layer.width = this.uiRoot.width || 1080;
            layer.height = this.uiRoot.height || 1920;
            parent.addChild(layer);
        }
        layer.visible = true;
        layer.mouseEnabled = false;
        return layer;
    }

    private setupDefaultClickableTileMarker(): void {
        const marker = this.defaultClickableTileMarker;
        if (!marker) return;
        const position = this.hexToWorld(OPENING_TILE_COL, OPENING_TILE_ROW);
        marker.transform.position = new Laya.Vector3(position.x, 0.28, position.z);
        marker.transform.localScale = new Laya.Vector3(1, 1, 1);
        marker.active = false;
    }

    private createWaterFloor(): void {
        this.hideEditorWaterSample();
        const water = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createPlane(WATER_FLOOR_SIZE, WATER_FLOOR_SIZE, 1, 1), "WaterFloor");
        const material = new Laya.UnlitMaterial();
        material.albedoColor = this.colorFromHex(COLOR_WATER);
        material.albedoIntensity = 1.05;
        material.cull = Laya.RenderState.CULL_NONE;
        material.tilingOffset = new Laya.Vector4(4, 4, 0, 0);
        water.meshRenderer.sharedMaterial = material;
        this.setShadowReceiving(water, this.enableProjectedShadows);
        water.transform.rotationEuler = new Laya.Vector3(0, 0, 0);
        water.transform.position = new Laya.Vector3(0, WATER_FLOOR_Y, 0);
        this.getWaterLayer().addChild(water);
    }

    private hideEditorWaterSample(): void {
        const sample = this.getWaterLayer().getChildByName("WaterSurfaceSample") as Laya.Sprite3D | null;
        if (sample) sample.active = false;
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
        node.meshRenderer.sharedMaterial = this.createTileSurfaceMaterial(this.getTileColor(tile));
        this.setShadowCasting(node, this.enableProjectedShadows);
        this.setShadowReceiving(node, this.enableProjectedShadows);
        node.transform.position = this.hexToWorld(tile.col, tile.row);
        node.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
        this.createHexTileVisual(node, tile);
        node.addChild(this.createHexOutline(tile));
        return node;
    }

    private createHexTileVisual(parent: Laya.Sprite3D, tile: HexTileState): void {
        if (!this.hexTilePrefabPath) return;
        const container = new Laya.Sprite3D("MatchedHexTileVisual");
        parent.addChild(container);
        this.createPrefabVisual(container, this.hexTilePrefabPath, new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.tileModelScale), this.getTileColor(tile), MODEL_FOOTPRINT_LIMIT);
    }

    private createHexOutline(tile: HexTileState): Laya.PixelLineSprite3D {
        const outline = new Laya.PixelLineSprite3D(6, `HexOutline_${tile.col}_${tile.row}`);
        const color = this.colorFromHex(COLOR_TILE_OUTLINE);
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
        base.transform.position = new Laya.Vector3(tilePos.x, this.getModelBaseY(tilePos), tilePos.z);
        base.transform.localScale = new Laya.Vector3(BASE_VISUAL_SCALE, BASE_VISUAL_SCALE, BASE_VISUAL_SCALE);
        this.setupBaseComposite(base, base === this.enemyBase ? "enemy" : "player");
    }

    private setupBaseComposite(base: Laya.Sprite3D, team: Team): void {
        base.destroyChildren();
        const tileVisual = new Laya.Sprite3D("BaseTileVisual");
        tileVisual.transform.localPosition = new Laya.Vector3(0, -MODEL_BASE_Y, 0);
        base.addChild(tileVisual);
        this.createPrefabVisual(tileVisual, this.hexTilePrefabPath, new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.tileModelScale), team === "player" ? COLOR_PLAYER_TILE : COLOR_ENEMY_TILE, MODEL_FOOTPRINT_LIMIT);

        const buildingVisual = new Laya.Sprite3D("BaseBuildingVisual");
        buildingVisual.transform.localPosition = new Laya.Vector3(0, 0, 0);
        base.addChild(buildingVisual);
        this.createPrefabVisual(buildingVisual, this.baseBuildingPrefabPath, new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.baseBuildingModelScale), team === "player" ? COLOR_PLAYER_TILE : COLOR_ENEMY_TILE, BUILDING_FOOTPRINT_LIMIT);
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

    private setupUiLayers(): void {
        const worldOverlay = this.getOrCreateUiLayer("World Overlay Layer", 0);
        const guide = this.getOrCreateUiLayer("Guide Layer", 1);
        const hud = this.getOrCreateUiLayer("HUD Layer", 2);
        const modal = this.getOrCreateUiLayer("Modal Layer", 3);
        const result = this.getOrCreateUiLayer("Result Layer", 4);
        this.uiLayers = { hud, worldOverlay, guide, modal, result };

        hud.addChild(this.timerLabel);
        hud.addChild(this.moneyLabel);
        guide.addChild(this.hintLabel);
        modal.addChild(this.cardPanel);
        result.addChild(this.resultPanel);
        result.addChild(this.ctaButton);
    }

    private getOrCreateUiLayer(name: string, index: number): Laya.Sprite {
        const found = this.uiRoot.getChildByName(name) as Laya.Sprite | null;
        const layer = found && !found.destroyed ? found : new Laya.Sprite();
        layer.name = name;
        layer.width = this.uiRoot.width || Laya.stage.width || DESIGN_WIDTH;
        layer.height = this.uiRoot.height || Laya.stage.height || DESIGN_HEIGHT;
        layer.mouseEnabled = name === "Modal Layer" || name === "Result Layer";
        if (!layer.parent) this.uiRoot.addChild(layer);
        this.uiRoot.setChildIndex(layer, Math.min(index, Math.max(0, this.uiRoot.numChildren - 1)));
        return layer;
    }

    private setUiMode(mode: UiMode): void {
        this.uiMode = mode;
        if (!this.uiLayers) return;
        this.uiLayers.hud.visible = mode !== "result";
        this.uiLayers.worldOverlay.visible = mode === "tutorial" || mode === "battle";
        this.uiLayers.guide.visible = mode === "tutorial";
        this.uiLayers.modal.visible = mode === "cardChoice";
        this.uiLayers.result.visible = mode === "result";
        this.cardPanel.visible = mode === "cardChoice";
        this.resultPanel.visible = mode === "result";
        this.ctaButton.visible = mode === "result";
        this.hintLabel.visible = mode === "tutorial";
    }

    private applyUiSkins(): void {
        this.applyPanelSkin(this.cardPanel, this.cardPanelSkinPath, "CardPanelSkin");
        this.applyPanelSkin(this.resultPanel, this.resultPanelSkinPath, "ResultPanelSkin");
        this.applyButtonSkin(this.cardButtonA, this.cardOptionSkinPath);
        this.applyButtonSkin(this.cardButtonB, this.cardOptionSkinPath);
        this.applyButtonSkin(this.cardButtonC, this.cardOptionSkinPath);
        this.applyTutorialHintSkin();
    }

    private applyReferenceUiLayout(): void {
        this.styleTimerLabel();
        this.styleCoinWallet();
        this.styleHintLabel();
        this.styleCardPanel();
        this.styleResultPanel();
        this.styleCtaButton();
        this.setupFirstTapPrompt();
        this.playerHpBar = this.createHpBar("PlayerHpBar");
        this.enemyHpBar = this.createHpBar("EnemyHpBar");
    }

    private styleTimerLabel(): void {
        this.setDesignRect(this.timerLabel, 390, 48, 300, 112);
        this.timerLabel.fontSize = this.scaleFont(58);
        this.timerLabel.bold = true;
        this.timerLabel.align = "center";
        this.timerLabel.valign = "middle";
        this.timerLabel.color = "#FFFFFF";
        this.timerLabel.stroke = 6;
        this.timerLabel.strokeColor = "#101A22";
        (this.timerLabel as Laya.Label & { bgColor?: string }).bgColor = "#173444";
    }

    private styleCoinWallet(): void {
        const parent = this.uiLayers?.hud ?? this.uiRoot;
        if (this.moneyLabel.parent !== parent) parent.addChild(this.moneyLabel);
        this.setDesignRect(this.moneyLabel, 850, 1225, 220, 78);
        this.moneyLabel.fontSize = this.scaleFont(38);
        this.moneyLabel.bold = true;
        this.moneyLabel.align = "center";
        this.moneyLabel.valign = "middle";
        this.moneyLabel.color = "#FFF4CA";
        this.moneyLabel.stroke = 5;
        this.moneyLabel.strokeColor = "#111111";
        (this.moneyLabel as Laya.Label & { bgColor?: string }).bgColor = "#332B5C";
        this.walletCoinIcon = this.getOrCreateImage(parent, "WalletCoinIcon", this.coinIconPath, this.walletCoinIcon);
        this.setDesignRect(this.walletCoinIcon, 875, 1238, 54, 54);
        this.walletCoinIcon.visible = true;
        parent.setChildIndex(this.walletCoinIcon, parent.getChildIndex(this.moneyLabel) + 1);
    }

    private styleHintLabel(): void {
        const parent = this.uiLayers?.guide ?? this.uiRoot;
        if (this.hintLabel.parent !== parent) parent.addChild(this.hintLabel);
        this.setDesignRect(this.hintLabel, 70, 1110, 940, 130);
        this.hintLabel.text = "点击绿色地块进攻！";
        this.hintLabel.fontSize = this.scaleFont(72);
        this.hintLabel.bold = true;
        this.hintLabel.align = "center";
        this.hintLabel.valign = "middle";
        this.hintLabel.color = "#FFFFFF";
        this.hintLabel.stroke = 8;
        this.hintLabel.strokeColor = "#050505";
    }

    private styleCardPanel(): void {
        const parent = this.uiLayers?.modal ?? this.uiRoot;
        if (this.cardPanel.parent !== parent) parent.addChild(this.cardPanel);
        this.setDesignRect(this.cardPanel, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
        const skin = this.cardPanel.getChildByName("CardPanelSkin") as Laya.Image | null;
        if (skin) {
            skin.width = this.cardPanel.width;
            skin.height = this.cardPanel.height;
            skin.visible = false;
        }
        this.hideCardPanelEditorSamples();
        this.styleCardOptionButtons();
    }

    private hideCardPanelEditorSamples(): void {
        const editorOnlyNames = ["CardPanelAssetSample", "CardOptionAssetSample", "CardTitle"];
        for (const name of editorOnlyNames) {
            const child = this.cardPanel.getChildByName(name) as Laya.Sprite | null;
            if (child) child.visible = false;
        }
    }

    private styleCardOptionButtons(): void {
        const title = this.getOrCreateLabel(this.cardPanel, "CardPanelTitle");
        title.text = "选择一项升级";
        this.setDesignRect(title, 70, 468, 940, 130);
        title.fontSize = this.scaleFont(82);
        title.bold = true;
        title.align = "center";
        title.valign = "middle";
        title.color = "#FFFFFF";
        title.stroke = 12;
        title.strokeColor = "#050505";
        title.mouseEnabled = false;

        this.styleCardOptionButton(this.cardButtonA, 0);
        this.styleCardOptionButton(this.cardButtonB, 1);
        this.styleCardOptionButton(this.cardButtonC, 2);
        this.updateCardOptionButtons();
    }

    private styleCardOptionButton(button: Laya.Button, index: number): void {
        if (index === 0) this.setDesignRect(this.cardButtonA, 42, 748, 295, 435);
        if (index === 1) this.setDesignRect(this.cardButtonB, 392, 736, 295, 455);
        if (index === 2) this.setDesignRect(this.cardButtonC, 742, 748, 295, 435);
        button.label = "";
        button.stateNum = 2;
        button.sizeGrid = "24,24,24,24";

        const glow = this.getOrCreateSprite(button, "CardOptionGlow");
        glow.width = button.width;
        glow.height = button.height;
        glow.x = 0;
        glow.y = 0;
        button.setChildIndex(glow, 0);

        const face = this.getOrCreateSprite(button, "CardOptionFace");
        face.width = button.width * 0.82;
        face.height = button.height * 0.66;
        face.x = button.width * 0.09;
        face.y = button.height * 0.1;
        face.mouseEnabled = false;

        const ribbon = this.getOrCreateSprite(button, "CardOptionRibbon");
        ribbon.width = button.width * 0.76;
        ribbon.height = button.height * 0.18;
        ribbon.x = button.width * 0.12;
        ribbon.y = button.height * 0.68;
        ribbon.mouseEnabled = false;

        const icon = this.getOrCreateImage(button, "CardOptionIcon", this.cardIconPath);
        icon.skin = this.cardIconPath;
        icon.width = button.width * 0.46;
        icon.height = icon.width;
        icon.x = (button.width - icon.width) * 0.5;
        icon.y = button.height * 0.25;
        icon.mouseEnabled = false;

        const cardTitle = this.getOrCreateLabel(button, "CardOptionTitle");
        cardTitle.x = button.width * 0.08;
        cardTitle.y = button.height * 0.72;
        cardTitle.width = button.width * 0.84;
        cardTitle.height = button.height * 0.14;
        cardTitle.fontSize = this.scaleFont(40);
        cardTitle.bold = true;
        cardTitle.align = "center";
        cardTitle.valign = "middle";
        cardTitle.color = "#FFFFFF";
        cardTitle.stroke = 8;
        cardTitle.strokeColor = "#050505";
        cardTitle.mouseEnabled = false;

        const description = this.getOrCreateLabel(button, "CardOptionDescription");
        description.x = button.width * 0.12;
        description.y = button.height * 0.86;
        description.width = button.width * 0.76;
        description.height = button.height * 0.08;
        description.fontSize = this.scaleFont(20);
        description.bold = true;
        description.align = "center";
        description.valign = "middle";
        description.color = "#FFF4C8";
        description.stroke = 3;
        description.strokeColor = "#111111";
        description.mouseEnabled = false;

        const hand = this.getOrCreateLabel(button, "CardOptionHand");
        hand.text = index === 1 ? "☝" : "";
        hand.x = button.width * 0.55;
        hand.y = button.height * 0.58;
        hand.width = button.width * 0.42;
        hand.height = button.height * 0.28;
        hand.fontSize = this.scaleFont(78);
        hand.bold = true;
        hand.align = "center";
        hand.valign = "middle";
        hand.stroke = 6;
        hand.strokeColor = "#050505";
        hand.color = "#FFFFFF";
        hand.mouseEnabled = false;
    }

    private styleResultPanel(): void {
        const parent = this.uiLayers?.result ?? this.uiRoot;
        if (this.resultPanel.parent !== parent) parent.addChild(this.resultPanel);
        if (this.ctaButton.parent !== parent) parent.addChild(this.ctaButton);
        this.setDesignRect(this.resultPanel, 80, 590, 920, 650);
        this.resultPanel.mouseEnabled = true;

        const legacySkin = this.resultPanel.getChildByName("ResultPanelSkin") as Laya.Image | null;
        if (legacySkin) legacySkin.visible = false;
        const sample = this.resultPanel.getChildByName("ResultPanelAssetSample") as Laya.Sprite | null;
        if (sample) sample.visible = false;

        this.configureSingleLineResultLabel(this.resultTitle, 120, 212, 680, 78, 58, RESULT_PANEL_DARK, 0, RESULT_PANEL_DARK);
        this.configureSingleLineResultLabel(this.resultText, 130, 302, 660, 54, 32, "#D98720", 0, "#D98720");
        this.setDesignRect(this.resultCtaButton, 220, 480, 480, 126);
        this.resultCtaButton.stateNum = 2;
        this.resultCtaButton.skin = "";
        this.resultCtaButton.label = "立即下载";
        this.resultCtaButton.labelSize = this.scaleFont(46);
        this.resultCtaButton.labelBold = true;
        this.resultCtaButton.labelColors = "#FFFFFF,#FFFFFF,#FFFFFF";
        this.resultCtaButton.labelStroke = 6;
        this.resultCtaButton.labelStrokeColor = RESULT_PANEL_DARK;
        this.resultCtaButton.sizeGrid = "0,0,0,0";

        const art = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_ART_LAYER);
        this.resultPanel.setChildIndex(art, 0);
        this.drawResultPanelArt(true);
        this.resultPanel.setChildIndex(this.resultTitle, Math.min(this.resultPanel.numChildren - 1, this.resultPanel.getChildIndex(art) + 3));
        this.resultPanel.setChildIndex(this.resultText, Math.min(this.resultPanel.numChildren - 1, this.resultPanel.getChildIndex(this.resultTitle) + 1));
        this.resultPanel.setChildIndex(this.resultCtaButton, this.resultPanel.numChildren - 1);
    }

    private configureSingleLineResultLabel(label: Laya.Label, x: number, y: number, width: number, height: number, fontSize: number, color: string, stroke: number, strokeColor: string): void {
        if (label.parent !== this.resultPanel) this.resultPanel.addChild(label);
        this.setDesignRect(label, x, y, width, height);
        label.fontSize = this.scaleFont(fontSize);
        label.bold = true;
        label.align = "center";
        label.valign = "middle";
        label.color = color;
        label.stroke = stroke;
        label.strokeColor = strokeColor;
        label.wordWrap = false;
        label.overflow = Laya.Text.HIDDEN;
        label.mouseEnabled = false;
    }

    private drawResultPanelArt(victory: boolean): void {
        const accent = victory ? RESULT_PANEL_GREEN : RESULT_PANEL_RED;
        const ctaColor = victory ? RESULT_PANEL_ORANGE : RESULT_PANEL_GREEN;
        const badgeColor = victory ? RESULT_PANEL_GOLD : "#FF8A2A";
        const scale = Math.min(this.getUiScaleX(), this.getUiScaleY());
        const art = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_ART_LAYER);
        art.width = this.resultPanel.width;
        art.height = this.resultPanel.height;
        art.graphics.clear();
        art.graphics.drawCircle(-68 * this.getUiScaleX(), 80 * this.getUiScaleY(), 130 * scale, "rgba(139,229,255,0.62)");
        art.graphics.drawCircle(890 * this.getUiScaleX(), 210 * this.getUiScaleY(), 112 * scale, victory ? "rgba(130,224,58,0.72)" : "rgba(255,51,51,0.62)");
        art.graphics.drawRect(72 * this.getUiScaleX(), 96 * this.getUiScaleY(), 776 * this.getUiScaleX(), 398 * this.getUiScaleY(), RESULT_PANEL_SHADOW);
        art.graphics.drawRect(72 * this.getUiScaleX(), 72 * this.getUiScaleY(), 776 * this.getUiScaleX(), 398 * this.getUiScaleY(), RESULT_PANEL_DARK);
        art.graphics.drawRect(86 * this.getUiScaleX(), 86 * this.getUiScaleY(), 748 * this.getUiScaleX(), 370 * this.getUiScaleY(), RESULT_PANEL_CREAM);

        const badge = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_BADGE_LAYER);
        badge.width = this.resultPanel.width;
        badge.height = this.resultPanel.height;
        badge.graphics.clear();
        badge.graphics.drawCircle(460 * this.getUiScaleX(), 72 * this.getUiScaleY(), 92 * scale, RESULT_PANEL_DARK);
        badge.graphics.drawCircle(460 * this.getUiScaleX(), 72 * this.getUiScaleY(), 78 * scale, badgeColor);
        this.drawResultHexTile(badge, 460 * this.getUiScaleX(), 72 * this.getUiScaleY(), 38 * scale, accent, RESULT_PANEL_DARK, 5 * scale);

        const hexStrip = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_HEX_STRIP_LAYER);
        hexStrip.width = this.resultPanel.width;
        hexStrip.height = this.resultPanel.height;
        hexStrip.graphics.clear();
        this.drawResultHexTile(hexStrip, 342 * this.getUiScaleX(), 410 * this.getUiScaleY(), 42 * scale, RESULT_PANEL_GREEN, RESULT_PANEL_DARK, 4 * scale);
        this.drawResultHexTile(hexStrip, 460 * this.getUiScaleX(), 410 * this.getUiScaleY(), 42 * scale, COLOR_NEUTRAL_TILE, RESULT_PANEL_DARK, 4 * scale);
        this.drawResultHexTile(hexStrip, 578 * this.getUiScaleX(), 410 * this.getUiScaleY(), 42 * scale, RESULT_PANEL_RED, RESULT_PANEL_DARK, 4 * scale);

        const ctaArt = this.getOrCreateSprite(this.resultCtaButton, RESULT_PANEL_CTA_ART_LAYER);
        ctaArt.width = this.resultCtaButton.width;
        ctaArt.height = this.resultCtaButton.height;
        ctaArt.graphics.clear();
        ctaArt.graphics.drawRect(0, 10 * this.getUiScaleY(), this.resultCtaButton.width, this.resultCtaButton.height - 10 * this.getUiScaleY(), victory ? "#9D3C10" : "#3C8E1E");
        ctaArt.graphics.drawRect(0, 0, this.resultCtaButton.width, this.resultCtaButton.height - 10 * this.getUiScaleY(), RESULT_PANEL_DARK);
        ctaArt.graphics.drawRect(10 * this.getUiScaleX(), 10 * this.getUiScaleY(), this.resultCtaButton.width - 20 * this.getUiScaleX(), this.resultCtaButton.height - 30 * this.getUiScaleY(), ctaColor);
        this.resultCtaButton.setChildIndex(ctaArt, 0);
    }

    private drawResultHexTile(target: Laya.Sprite, centerX: number, centerY: number, radius: number, fillColor: string, lineColor: string, lineWidth: number): void {
        const points: number[] = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 6 + i * Math.PI / 3;
            points.push(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        }
        target.graphics.drawPoly(0, 0, points, fillColor, lineColor, lineWidth);
    }

    private styleCtaButton(): void {
        this.setDesignRect(this.ctaButton, 300, 1740, 480, 118);
        this.ctaButton.visible = false;
    }

    private applyPanelSkin(panel: Laya.Sprite, skinPath: string, name: string): void {
        if (!skinPath || panel.getChildByName(name)) return;
        const skin = new Laya.Image(skinPath);
        skin.name = name;
        skin.width = panel.width;
        skin.height = panel.height;
        skin.sizeGrid = "24,24,24,24";
        panel.addChildAt(skin, 0);
    }

    private applyButtonSkin(button: Laya.Button, skinPath: string): void {
        if (!skinPath) return;
        button.skin = skinPath;
        button.sizeGrid = "24,24,24,24";
    }

    private applyTutorialHintSkin(): void {
        if (!this.tutorialHintSkinPath || !this.hintLabel.parent || this.hintLabel.parent.getChildByName("TutorialHintAssetIcon")) return;
        const icon = new Laya.Image(this.tutorialHintSkinPath);
        icon.name = "TutorialHintAssetIcon";
        icon.width = 64;
        icon.height = 64;
        icon.x = this.hintLabel.x + 24;
        icon.y = this.hintLabel.y + 12;
        this.hintLabel.parent.addChild(icon);
    }

    private setupFirstTapPrompt(): void {
        const parent = this.uiLayers?.guide ?? this.uiRoot;
        this.firstTapHighlight = this.getOrCreateSprite(parent, "FirstTapHighlight", this.firstTapHighlight);
        this.firstTapHand = this.getOrCreateImage(parent, "FirstTapHand", this.handIconPath, this.firstTapHand);
        this.positionFirstTapPrompt();
        this.setFirstTapPromptVisible(true);
    }

    private positionFirstTapPrompt(): void {
        const worldPos = this.hexToWorld(OPENING_TILE_COL, OPENING_TILE_ROW);
        const uiPos = this.projectWorldToUi(new Laya.Vector3(worldPos.x, this.getTileSurfaceY(worldPos) + 0.24, worldPos.z));
        const highlightWidth = 310 * this.getUiScaleX();
        const highlightHeight = 260 * this.getUiScaleY();
        if (this.firstTapHighlight) {
            this.firstTapHighlight.graphics.clear();
            this.firstTapHighlight.graphics.drawRect(0, 0, highlightWidth, highlightHeight, "rgba(255,255,255,0.68)");
            this.firstTapHighlight.width = highlightWidth;
            this.firstTapHighlight.height = highlightHeight;
            this.firstTapHighlight.x = uiPos.x - highlightWidth * 0.5;
            this.firstTapHighlight.y = uiPos.y - highlightHeight * 0.56;
            const parent = this.uiLayers?.guide ?? this.uiRoot;
            parent.setChildIndex(this.firstTapHighlight, Math.max(0, parent.getChildIndex(this.hintLabel) - 1));
        }
        if (this.firstTapHand) {
            this.firstTapHand.width = 150 * this.getUiScaleX();
            this.firstTapHand.height = 150 * this.getUiScaleY();
            this.firstTapHand.x = uiPos.x + 10 * this.getUiScaleX();
            this.firstTapHand.y = uiPos.y - 62 * this.getUiScaleY();
        }
    }

    private setFirstTapPromptVisible(visible: boolean): void {
        if (this.firstTapHighlight) this.firstTapHighlight.visible = visible;
        if (this.firstTapHand) this.firstTapHand.visible = visible;
        this.hintLabel.visible = true;
        if (visible) this.hintLabel.text = "点击绿色地块进攻！";
    }

    private createHpBar(name: string): Laya.Sprite {
        const parent = this.uiLayers?.worldOverlay ?? this.uiRoot;
        const existing = parent.getChildByName(name) as Laya.Sprite | null;
        if (existing && !existing.destroyed) return existing;
        const bar = new Laya.Sprite();
        bar.name = name;
        bar.width = 210 * this.getUiScaleX();
        bar.height = 42 * this.getUiScaleY();
        bar.mouseEnabled = false;

        const fill = new Laya.Sprite();
        fill.name = "HpBarFill";
        fill.width = 198 * this.getUiScaleX();
        fill.height = 26 * this.getUiScaleY();
        fill.x = 6 * this.getUiScaleX();
        fill.y = 8 * this.getUiScaleY();
        bar.addChild(fill);

        const text = new Laya.Label();
        text.text = "100";
        text.name = "HpBarText";
        text.width = bar.width;
        text.height = bar.height;
        text.fontSize = this.scaleFont(22);
        text.bold = true;
        text.align = "center";
        text.valign = "middle";
        text.color = "#FFFFFF";
        text.stroke = 3;
        text.strokeColor = "#111111";
        text.mouseEnabled = false;
        bar.addChild(text);
        parent.addChild(bar);
        return bar;
    }

    private updateHpBars(): void {
        if (this.playerHpBar) this.playerHpBar.visible = false;
        if (this.enemyHpBar) this.enemyHpBar.visible = false;
    }

    private updateHpBar(bar: Laya.Sprite, target: Laya.Sprite3D, hp: number, visible: boolean): void {
        bar.visible = visible;
        if (!visible) return;
        const position = target.transform.position;
        const uiPos = this.projectWorldToUi(new Laya.Vector3(position.x, position.y + 0.96, position.z));
        bar.x = uiPos.x - bar.width * 0.5;
        bar.y = uiPos.y - 46 * this.getUiScaleY();
        bar.graphics.clear();
        bar.graphics.drawRect(0, 0, bar.width, bar.height, "#111111");
        bar.graphics.drawRect(4 * this.getUiScaleX(), 6 * this.getUiScaleY(), bar.width - 8 * this.getUiScaleX(), bar.height - 12 * this.getUiScaleY(), "#0B3F15");
        const fill = bar.getChildByName("HpBarFill") as Laya.Sprite | null;
        const text = bar.getChildByName("HpBarText") as Laya.Label | null;
        const ratio = Math.max(0, Math.min(1, hp / BASE_HP_MAX));
        if (fill) {
            fill.graphics.clear();
            fill.graphics.drawRect(0, 0, (bar.width - 12 * this.getUiScaleX()) * ratio, fill.height, "#25F22C");
        }
        if (text) text.text = `${Math.max(0, Math.ceil(hp))}`;
    }

    private getOrCreateSprite(parent: Laya.Sprite, name: string, existing?: Laya.Sprite): Laya.Sprite {
        if (existing && !existing.destroyed) return existing;
        const found = parent.getChildByName(name) as Laya.Sprite | null;
        if (found && !found.destroyed) return found;
        const sprite = new Laya.Sprite();
        sprite.name = name;
        sprite.mouseEnabled = false;
        parent.addChild(sprite);
        return sprite;
    }

    private getOrCreateImage(parent: Laya.Sprite, name: string, skinPath: string, existing?: Laya.Image): Laya.Image {
        if (existing && !existing.destroyed) return existing;
        const found = parent.getChildByName(name) as Laya.Image | null;
        if (found && !found.destroyed) return found;
        const image = new Laya.Image(skinPath);
        image.name = name;
        image.mouseEnabled = false;
        parent.addChild(image);
        return image;
    }

    private getOrCreateLabel(parent: Laya.Sprite, name: string): Laya.Label {
        const found = parent.getChildByName(name) as Laya.Label | null;
        if (found && !found.destroyed) return found;
        const label = new Laya.Label();
        label.name = name;
        label.mouseEnabled = false;
        parent.addChild(label);
        return label;
    }

    private getUiScaleX(): number {
        return (this.uiRoot.width || Laya.stage.width || DESIGN_WIDTH) / DESIGN_WIDTH;
    }

    private getUiScaleY(): number {
        return (this.uiRoot.height || Laya.stage.height || DESIGN_HEIGHT) / DESIGN_HEIGHT;
    }

    private setDesignRect(node: Laya.Sprite, x: number, y: number, width: number, height: number): void {
        const sx = this.getUiScaleX();
        const sy = this.getUiScaleY();
        node.x = x * sx;
        node.y = y * sy;
        node.width = width * sx;
        node.height = height * sy;
    }

    private scaleFont(size: number): number {
        return Math.round(size * Math.min(this.getUiScaleX(), this.getUiScaleY()));
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
        if (!this.canUnlockFocusedTile(tile)) {
            this.hintLabel.text = this.money < this.hexCost ? "金币不足，等待收入" : "只能占领相邻中立地块";
            return;
        }
        this.tiles = claimTile(this.tiles, tile.col, tile.row);
        this.unlockCostFocusTile = this.tiles.find((item) => item.col === tile.col && item.row === tile.row) ?? tile;
        this.money -= this.hexCost;
        this.updateTileVisual(tile.col, tile.row);
        this.pendingInitialBuildPosition = this.hexToWorld(tile.col, tile.row);
        this.clearUnlockCostLabels();
        this.showCards();
        this.hintLabel.text = "选择建筑，部署到新地块！";
        this.refreshHud();
    }

    private showOpeningBuildChoice(): void {
        const tile = this.tiles.find((item) => item.col === OPENING_TILE_COL && item.row === OPENING_TILE_ROW) ?? null;
        this.unlockCostFocusTile = tile;
        this.pendingInitialBuildPosition = this.hexToWorld(OPENING_TILE_COL, OPENING_TILE_ROW);
        this.clearUnlockCostLabels();
        if (this.defaultClickableTileMarker) this.defaultClickableTileMarker.active = false;
        this.setFirstTapPromptVisible(false);
        this.showCards();
    }

    private startBattleAfterInitialCard(position: Laya.Vector3): void {
        if (this.gameStarted) return;
        this.gameStarted = true;
        const enemyBuilding = this.chooseEnemyOpeningBuilding();
        this.activateInitialBase(this.enemyBase, this.hexToWorld(3, 1), "enemy", enemyBuilding);
        this.setFirstTapPromptVisible(false);
        this.updateHpBars();
        this.setUiMode("battle");
        this.hintLabel.text = "建筑已建成，点击金币解锁相邻地块！";
    }

    private chooseEnemyOpeningBuilding(): BuildingKind {
        const kind = this.enemyOpeningBuildings[this.nextEnemyBuildingIndex % this.enemyOpeningBuildings.length];
        this.nextEnemyBuildingIndex++;
        return kind;
    }

    private activateInitialBase(base: Laya.Sprite3D, position: Laya.Vector3, team: Team, kind: BuildingKind): void {
        base.active = true;
        base.transform.position = new Laya.Vector3(position.x, this.getModelBaseY(position), position.z);
        base.transform.localScale = new Laya.Vector3(BASE_VISUAL_SCALE, BASE_VISUAL_SCALE, BASE_VISUAL_SCALE);
        this.setupBaseComposite(base, team);
        const progressSprite = this.createSpawnProgressSprite(base.transform.position, team);
        this.buildings.push({ kind, category: this.getBuildingCategory(kind), team, position: base.transform.position.clone(), cooldown: createSpawnCooldown(this.getBuildingInterval(kind)), progressSprite, hp: BUILDING_MAX_HP, attackCooldown: 0, node: base, unitKind: this.getBuildingUnitKind(kind), goldPerCycle: 0, hpBar: this.createBuildingHpBar(base, BUILDING_MAX_HP) });
        if (this.getBuildingCategory(kind) === "unit") this.spawnUnit(team, base.transform.position, "spear");
        this.updateHpBars();
    }

    private showCards(): void {
        this.pausedForCards = true;
        this.activeCardChoices = this.createCardChoices();
        this.updateCardOptionButtons();
        this.cardPanel.visible = true;
        this.setFirstTapPromptVisible(false);
        this.setUiMode("cardChoice");
        this.hintLabel.text = "选择一张卡牌强化防线";
    }

    private createCardChoices(): CardId[] {
        const unitCard = this.unitCards[this.nextUnitCardStart % this.unitCards.length];
        this.nextUnitCardStart = (this.nextUnitCardStart + 1) % this.unitCards.length;
        return [this.defenseCards[0], this.resourceCards[0], unitCard];
    }

    private getCardLabel(cardId: CardId): string {
        return this.getCardOptionTitle(cardId);
    }

    private updateCardOptionButtons(): void {
        this.updateCardOptionButton(this.cardButtonA, this.activeCardChoices[0]);
        this.updateCardOptionButton(this.cardButtonB, this.activeCardChoices[1]);
        this.updateCardOptionButton(this.cardButtonC, this.activeCardChoices[2]);
    }

    private updateCardOptionButton(button: Laya.Button, cardId: CardId): void {
        if (!button || !cardId) return;
        button.label = "";
        const accent = this.getCardOptionAccent(cardId);
        const glow = this.getOrCreateSprite(button, "CardOptionGlow");
        glow.graphics.clear();
        glow.graphics.drawRect(0, 0, button.width, button.height, "#152017");
        glow.graphics.drawRect(10 * this.getUiScaleX(), 12 * this.getUiScaleY(), button.width - 20 * this.getUiScaleX(), button.height - 22 * this.getUiScaleY(), accent);
        glow.alpha = 1;
        glow.mouseEnabled = false;

        const face = this.getOrCreateSprite(button, "CardOptionFace");
        face.graphics.clear();
        face.graphics.drawRect(0, 0, face.width, face.height, this.getCardOptionFaceColor(cardId));
        face.graphics.drawCircle(face.width * 0.5, face.height * 0.42, Math.min(face.width, face.height) * 0.31, "#FFFFFF");
        face.alpha = 0.48;

        const ribbon = this.getOrCreateSprite(button, "CardOptionRibbon");
        ribbon.graphics.clear();
        ribbon.graphics.drawRect(0, 0, ribbon.width, ribbon.height, accent);
        ribbon.alpha = 0.92;

        const icon = this.getOrCreateImage(button, "CardOptionIcon", this.cardIconPath);
        icon.skin = this.cardIconPath;
        icon.visible = true;
        icon.mouseEnabled = false;

        const title = this.getOrCreateLabel(button, "CardOptionTitle");
        title.text = this.getCardOptionTitle(cardId);
        title.color = "#FFFFFF";

        const description = this.getOrCreateLabel(button, "CardOptionDescription");
        description.text = this.getCardOptionDescription(cardId);
        description.color = cardId === "goldMine" ? "#FFE66A" : "#FFF4C8";
    }

    private getCardOptionTitle(cardId: CardId): string {
        if (cardId === "arrowTower") return "箭塔";
        if (cardId === "goldMine") return "金矿";
        if (cardId === "spearBarracks") return "枪兵营";
        if (cardId === "archerBarracks") return "弓兵营";
        return "骑兵营";
    }

    private getCardOptionDescription(cardId: CardId): string {
        if (cardId === "arrowTower") return "远程压制";
        if (cardId === "goldMine") return "周期产金";
        if (cardId === "spearBarracks") return "高血近战";
        if (cardId === "archerBarracks") return "低血远程";
        return "高速冲锋";
    }

    private getCardOptionAccent(cardId: CardId): string {
        if (cardId === "arrowTower") return "#F6D348";
        if (cardId === "goldMine") return "#FFE05D";
        if (cardId === "spearBarracks") return "#80DC38";
        if (cardId === "archerBarracks") return "#4FC3FF";
        return "#FF8A2A";
    }

    private getCardOptionFaceColor(cardId: CardId): string {
        if (cardId === "arrowTower") return "#E6B335";
        if (cardId === "goldMine") return "#3BBF28";
        if (cardId === "spearBarracks") return "#9B41D1";
        if (cardId === "archerBarracks") return "#2B6FD6";
        return "#A95A1A";
    }

    private onPickCardA(): void { this.applyCard(this.activeCardChoices[0]); }
    private onPickCardB(): void { this.applyCard(this.activeCardChoices[1]); }
    private onPickCardC(): void { this.applyCard(this.activeCardChoices[2]); }

    private applyCard(cardId: CardId): void {
        this.suppressNextStageClick = true;
        this.cardPanel.visible = false;
        this.pausedForCards = false;
        Laya.stage.event(GameEvents.CARD_SELECTED, { cardId });
        const isOpeningBuild = !this.gameStarted;
        const position = this.pendingInitialBuildPosition ?? this.findBuildPosition();
        const buildSlot = isOpeningBuild ? this.initialBuildSlot : undefined;
        this.createBuildingMarker(position, this.getCardBuildingKind(cardId), "player", buildSlot);
        if (!this.gameStarted) this.startBattleAfterInitialCard(position);
        this.pendingInitialBuildPosition = null;
        this.updateUnlockCostLabels();
        this.setUiMode("battle");
        this.hintLabel.text = "点击金币图标，花费金币解锁相邻地块";
        this.refreshHud();
    }

    private getCardBuildingKind(cardId: CardId): BuildingKind {
        if (cardId === "arrowTower") return "tower";
        if (cardId === "goldMine") return "goldMine";
        return cardId;
    }

    private createSpawnProgressSprite(position: Laya.Vector3, team: Team): Laya.Sprite {
        const parent = this.uiLayers?.worldOverlay ?? this.uiRoot;
        const sprite = new Laya.Sprite();
        sprite.name = `${team}_SpawnProgress_${this.buildings.length}`;
        sprite.mouseEnabled = false;
        sprite.size(SPAWN_PROGRESS_SIZE, SPAWN_PROGRESS_SIZE);
        const bg = this.createSpawnProgressImage(this.spawnProgressBgPath, "SpawnProgressBg");
        const fill = this.createSpawnProgressImage(this.spawnProgressRingPath, "SpawnProgressFill");
        sprite.addChild(bg);
        sprite.addChild(fill);
        parent.addChild(sprite);
        this.positionProgressSprite(sprite, position);
        return sprite;
    }

    private createSpawnProgressImage(skin: string, name: string): Laya.Image {
        const image = new Laya.Image(skin);
        image.name = name;
        image.width = SPAWN_PROGRESS_SIZE;
        image.height = SPAWN_PROGRESS_SIZE;
        image.x = 0;
        image.y = 0;
        image.mouseEnabled = false;
        return image;
    }

    private createBuildingMarker(position: Laya.Vector3, kind: BuildingKind, team: Team = "player", slot?: Laya.Sprite3D): void {
        const node = slot ?? new Laya.Sprite3D(`${team}_${kind}_${this.buildings.length}`);
        node.name = slot ? `InitialBuildSlot_${kind}` : node.name;
        const color = this.getBuildingColor(kind, team);
        node.transform.position = new Laya.Vector3(position.x, this.getTileSurfaceY(position) + 0.04, position.z);
        if (!node.parent) this.buildingsRoot.addChild(node);
        else node.destroyChildren();
        this.addFallbackBuildingVisual(node, kind, color);
        this.createPrefabVisual(node, this.getBuildingPrefabPath(kind), new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.getBuildingModelScale(kind)), color, BUILDING_FOOTPRINT_LIMIT);
        const category = this.getBuildingCategory(kind);
        const progressSprite = this.createSpawnProgressSprite(node.transform.position, team);
        progressSprite.visible = category !== "defense";
        this.buildings.push({ kind, category, team, position: node.transform.position.clone(), cooldown: createSpawnCooldown(this.getBuildingInterval(kind)), progressSprite, hp: BUILDING_MAX_HP, attackCooldown: 0, node, unitKind: this.getBuildingUnitKind(kind), goldPerCycle: category === "resource" ? this.goldSupplyAmount : 0, hpBar: this.createBuildingHpBar(node, BUILDING_MAX_HP) });
        this.paintNeighborTilesFromBuilding(node.transform.position, team);
    }

    private spawnUnit(team: Team, position: Laya.Vector3, kind: UnitKind): void {
        const node = new Laya.Sprite3D(`${team}_${kind}_${this.units.length}`);
        const spawnPosition = this.createUnitSpawnPosition(team, position);
        node.transform.position = spawnPosition;
        this.unitsRoot.addChild(node);
        const stats = this.createUnitStats(team, kind);
        this.addFallbackUnitVisual(node, team, kind);
        this.createPrefabVisual(node, this.getUnitPrefabPath(kind), new Laya.Vector3(0, -UNIT_VISUAL_Y_OFFSET, 0), this.getModelScaleVector(this.getUnitModelScale(kind)), this.getUnitColor(team, kind), UNIT_FOOTPRINT_LIMIT, false);
        this.units.push({ team, kind, node, hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed, range: stats.range, attackCooldown: 0, hpBar: this.createUnitHpBar(node, stats.hp) });
    }

    private createUnitSpawnPosition(team: Team, position: Laya.Vector3): Laya.Vector3 {
        const target = team === "player" ? this.enemyBase.transform.position : this.playerBase.transform.position;
        const dirX = target.x - position.x;
        const dirZ = target.z - position.z;
        const len = Math.max(0.001, Math.sqrt(dirX * dirX + dirZ * dirZ));
        return new Laya.Vector3(position.x + dirX / len * UNIT_SPAWN_FORWARD_OFFSET, this.getModelBaseY(position) + UNIT_VISUAL_Y_OFFSET, position.z + dirZ / len * UNIT_SPAWN_FORWARD_OFFSET);
    }

    private createUnitHpBar(node: Laya.Sprite3D, maxHp: number): Laya.Sprite {
        return this.createWorldHpBar(`${node.name}_HpBar`, UNIT_HP_BAR_WIDTH, UNIT_HP_BAR_HEIGHT, maxHp, "UnitHpBarFill", "UnitHpBarText");
    }

    private createBuildingHpBar(node: Laya.Sprite3D, maxHp: number): Laya.Sprite {
        return this.createWorldHpBar(`${node.name}_BuildingHpBar`, BUILDING_HP_BAR_WIDTH, BUILDING_HP_BAR_HEIGHT, maxHp, "BuildingHpBarFill", "BuildingHpBarText");
    }

    private createWorldHpBar(name: string, width: number, height: number, maxHp: number, fillName: string, textName: string): Laya.Sprite {
        const parent = this.uiLayers?.worldOverlay ?? this.uiRoot;
        const bar = new Laya.Sprite();
        bar.name = name;
        bar.width = width * this.getUiScaleX();
        bar.height = height * this.getUiScaleY();
        bar.mouseEnabled = false;
        parent.addChild(bar);
        const fill = new Laya.Sprite();
        fill.name = fillName;
        bar.addChild(fill);
        const text = new Laya.Label();
        text.name = textName;
        text.width = bar.width;
        text.height = bar.height + 12 * this.getUiScaleY();
        text.y = -8 * this.getUiScaleY();
        text.text = `${maxHp}`;
        text.fontSize = this.scaleFont(16);
        text.bold = true;
        text.align = "center";
        text.valign = "middle";
        text.color = "#FFFFFF";
        text.stroke = 2;
        text.strokeColor = "#111111";
        text.mouseEnabled = false;
        bar.addChild(text);
        return bar;
    }

    private getBuildingColor(kind: BuildingKind, team: Team): string {
        if (team === "enemy") return COLOR_ENEMY_TILE;
        if (kind === "goldMine") return "#FFE15A";
        if (kind === "tower") return "#F8D34C";
        if (kind === "archerBarracks") return "#4FC3FF";
        if (kind === "cavalryBarracks") return "#FF8A2A";
        return COLOR_PLAYER_TILE;
    }

    private getUnitColor(team: Team, kind: UnitKind): string {
        if (team === "enemy") return COLOR_ENEMY_TILE;
        if (kind === "archer") return "#4FC3FF";
        if (kind === "cavalry") return "#FF8A2A";
        return "#4DEB7A";
    }

    private getBuildingModelScale(kind: BuildingKind): number {
        if (kind === "tower") return this.towerModelScale;
        if (kind === "spearBarracks") return this.barracksModelScale;
        if (kind === "archerBarracks") return this.barracksModelScale;
        if (kind === "cavalryBarracks") return this.barracksModelScale;
        if (kind === "goldMine") return this.barracksModelScale;
        return this.dragonNestModelScale;
    }

    private getBuildingPrefabPath(kind: BuildingKind): string {
        if (kind === "tower") return this.towerPrefabPath;
        if (kind === "spearBarracks") return this.barracksPrefabPath;
        if (kind === "archerBarracks") return this.barracksPrefabPath;
        if (kind === "cavalryBarracks") return this.dragonNestPrefabPath;
        if (kind === "goldMine") return this.barracksPrefabPath;
        return this.dragonNestPrefabPath;
    }

    private getBuildingCategory(kind: BuildingKind): BuildingCategory {
        if (kind === "tower") return "defense";
        if (kind === "goldMine") return "resource";
        return "unit";
    }

    private getBuildingUnitKind(kind: BuildingKind): UnitKind | undefined {
        if (kind === "spearBarracks") return "spear";
        if (kind === "archerBarracks") return "archer";
        if (kind === "cavalryBarracks") return "cavalry";
        return undefined;
    }

    private getBuildingInterval(kind: BuildingKind): number {
        if (kind === "goldMine") return this.resourceRate || this.spawnRate;
        if (kind === "spearBarracks") return this.spearBarracksRate || this.spawnRate;
        if (kind === "archerBarracks") return this.archerBarracksRate || this.spawnRate;
        if (kind === "cavalryBarracks") return this.cavalryBarracksRate || this.spawnRate;
        return this.spawnRate;
    }

    private getUnitPrefabPath(kind: UnitKind): string {
        if (kind === "cavalry") return this.dragonPrefabPath;
        return this.soldierPrefabPath;
    }

    private getUnitModelScale(kind: UnitKind): number {
        return kind === "cavalry" ? this.bossModelScale : this.soldierModelScale;
    }

    private createUnitStats(team: Team, kind: UnitKind): UnitStats {
        if (team === "enemy") return { hp: 100, damage: 10, speed: 1.6, range: 0.75 };
        switch (kind) {
            case "spear": return { hp: 72, damage: 5, speed: 1.35, range: 0.75 };
            case "archer": return { hp: 34, damage: 7, speed: 1.2, range: 2.6 };
            case "cavalry": return { hp: 54, damage: 8, speed: 2, range: 0.75 };
        }
    }

    private addFallbackBuildingVisual(node: Laya.Sprite3D, kind: BuildingKind, color: string): void {
        const visual = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(BUILDING_FOOTPRINT, kind === "tower" ? 0.95 : 0.56, BUILDING_FOOTPRINT), "FallbackBuildingVisual");
        visual.meshRenderer.sharedMaterial = this.createMaterial(color);
        this.setShadowCasting(visual, this.enableProjectedShadows);
        visual.transform.localPosition = new Laya.Vector3(0, kind === "tower" ? 0.48 : 0.28, 0);
        node.addChild(visual);
    }

    private addFallbackUnitVisual(node: Laya.Sprite3D, team: Team, kind: UnitKind): void {
        const mesh = Laya.PrimitiveMesh.createCapsule(kind === "cavalry" ? 0.48 : 0.34, kind === "cavalry" ? 1.45 : 1.08);
        const visual = new Laya.MeshSprite3D(mesh, "FallbackUnitVisual");
        visual.meshRenderer.sharedMaterial = this.createMaterial(this.getUnitColor(team, kind));
        this.setShadowCasting(visual, this.enableProjectedShadows);
        visual.transform.localPosition = new Laya.Vector3(0, 0.18, 0);
        node.addChild(visual);
    }

    private createPrefabVisual(parent: Laya.Sprite3D, path: string, localPosition: Laya.Vector3, localScale: Laya.Vector3, tintColor: string, footprintLimit: number, replaceFallback: boolean = true): void {
        if (!path) return;
        const runtimePath = this.resolveRuntimePrefabPath(path);
        void Laya.loader.load(runtimePath, Laya.Loader.HIERARCHY).then((prefab: Laya.Sprite3D | PrefabFactory | null) => {
            if (!prefab || parent.destroyed) return;
            try {
                const visual = this.createPrefabInstance(prefab);
                if (!visual || parent.destroyed) return;
                visual.name = "MatchedPrefabVisual";
                visual.transform.localPosition = localPosition;
                visual.transform.localScale = localScale;
                this.applyModelTint(visual, tintColor);
                this.setShadowCasting(visual, this.enableProjectedShadows);
                if (replaceFallback) parent.destroyChildren();
                parent.addChild(visual);
                this.fitPrefabToTile(visual, footprintLimit);
            } catch (error) {
                console.warn(`Failed to instantiate prefab visual: ${runtimePath}`, error);
            }
        });
    }

    private resolveRuntimePrefabPath(path: string): string {
        const normalized = path.replace(/\\/g, "/");
        return this.runtimePrefabPathMap[normalized] ?? normalized;
    }

    private createPrefabInstance(prefab: Laya.Sprite3D | PrefabFactory): Laya.Sprite3D | null {
        const prefabFactory = prefab as PrefabFactory;
        if (typeof prefabFactory.create === "function") return prefabFactory.create() as Laya.Sprite3D;
        if (typeof (prefab as unknown as { clone?: unknown }).clone === "function") return Laya.Sprite3D.instantiate(prefab as Laya.Sprite3D) as Laya.Sprite3D;
        return null;
    }

    private clampPrefabScale(scale: Laya.Vector3): Laya.Vector3 {
        return new Laya.Vector3(Math.min(MODEL_TILE_SCALE_CAP, scale.x), Math.min(MODEL_TILE_SCALE_CAP, scale.y), Math.min(MODEL_TILE_SCALE_CAP, scale.z));
    }

    private getModelScaleVector(scale: number): Laya.Vector3 {
        const safeScale = Math.max(0.01, scale);
        return new Laya.Vector3(safeScale, safeScale, safeScale);
    }

    private fitPrefabToTile(visual: Laya.Sprite3D, footprintLimit: number): void {
        const footprint = this.measureVisualFootprint(visual);
        if (footprint <= 0) return;
        const fitScale = Math.min(1, footprintLimit / footprint);
        if (fitScale >= 1) return;
        const current = visual.transform.localScale;
        visual.transform.localScale = new Laya.Vector3(current.x * fitScale, current.y * fitScale, current.z * fitScale);
    }

    private measureVisualFootprint(root: Laya.Sprite3D): number {
        let maxFootprint = 0;
        const stack: Array<{ node: Laya.Node; accumulatedScale: Laya.Vector3 }> = [{ node: root, accumulatedScale: this.getNodeLocalScale(root) }];
        while (stack.length > 0) {
            const { node, accumulatedScale } = stack.pop()!;
            const renderer = this.getNodeRenderer(node);
            const localFootprint = this.getBoundsFootprint(renderer?.localBounds);
            const worldFootprint = this.getBoundsFootprint(renderer?.bounds);
            const footprint = localFootprint > 0 ? localFootprint * Math.max(Math.abs(accumulatedScale.x), Math.abs(accumulatedScale.z)) : worldFootprint;
            if (footprint > maxFootprint) maxFootprint = footprint;
            for (let i = 0; i < node.numChildren; i++) {
                const child = node.getChildAt(i);
                stack.push({ node: child, accumulatedScale: this.multiplyScale(accumulatedScale, this.getNodeLocalScale(child)) });
            }
        }
        return maxFootprint;
    }

    private getNodeLocalScale(node: Laya.Node): Laya.Vector3 {
        const sprite = node as Laya.Sprite3D;
        return sprite.transform?.localScale ?? new Laya.Vector3(1, 1, 1);
    }

    private multiplyScale(a: Laya.Vector3, b: Laya.Vector3): Laya.Vector3 {
        return new Laya.Vector3(a.x * b.x, a.y * b.y, a.z * b.z);
    }

    private getBoundsFootprint(bounds?: BoundsLike): number {
        if (!bounds) return 0;
        if (typeof bounds.getExtent === "function") {
            const extent = bounds.getExtent();
            return Math.max(Math.abs(extent.x), Math.abs(extent.z)) * 2;
        }
        const min = bounds.min;
        const max = bounds.max;
        if (min && max) return Math.max(Math.abs(max.x - min.x), Math.abs(max.z - min.z));
        return 0;
    }

    private applyModelTint(root: Laya.Sprite3D, tintColor: string): void {
        const tintMaterial = this.createMaterial(tintColor);
        const stack: Laya.Node[] = [root];
        while (stack.length > 0) {
            const node = stack.pop()!;
            const renderer = this.getNodeRenderer(node);
            if (renderer) {
                renderer.sharedMaterial = tintMaterial;
                renderer.sharedMaterials = [tintMaterial];
            }
            for (let i = 0; i < node.numChildren; i++) stack.push(node.getChildAt(i));
        }
    }

    private setShadowCasting(root: Laya.Sprite3D, enabled: boolean): void {
        const stack: Laya.Node[] = [root];
        while (stack.length > 0) {
            const node = stack.pop()!;
            const renderer = this.getNodeRenderer(node);
            if (renderer) renderer.castShadow = enabled;
            for (let i = 0; i < node.numChildren; i++) stack.push(node.getChildAt(i));
        }
    }

    private setShadowReceiving(root: Laya.Sprite3D, enabled: boolean): void {
        const stack: Laya.Node[] = [root];
        while (stack.length > 0) {
            const node = stack.pop()!;
            const renderer = this.getNodeRenderer(node);
            if (renderer) renderer.receiveShadow = enabled;
            for (let i = 0; i < node.numChildren; i++) stack.push(node.getChildAt(i));
        }
    }

    private getNodeRenderer(node: Laya.Node): RendererLike | undefined {
        const sprite = node as Laya.Sprite3D & { meshRenderer?: RendererLike; skinnedMeshRenderer?: RendererLike; renderer?: RendererLike };
        return sprite.meshRenderer ?? sprite.skinnedMeshRenderer ?? sprite.renderer;
    }

    private updateUnlockCostLabels(): void {
        const layer = this.getOrCreateUnlockCostLayer();
        this.clearUnlockCostLabels();
        const focusTile = this.unlockCostFocusTile;
        if (!focusTile) return;
        if (this.firstClaim) {
            const openingCost = this.createUnlockCostItem(focusTile);
            layer.addChild(openingCost);
            this.unlockCostLabels.push(openingCost);
            return;
        }
        for (const tile of this.tiles) {
            if (!this.isUnlockCostTile(tile, focusTile)) continue;
            const item = this.createUnlockCostItem(tile);
            layer.addChild(item);
            this.unlockCostLabels.push(item);
        }
    }

    private isUnlockCostTile(tile: HexTileState, focusTile: HexTileState): boolean {
        if (tile.owner !== "neutral" || tile.kind === "void" || tile.kind === "water") return false;
        return isAdjacent(focusTile.col, focusTile.row, tile.col, tile.row);
    }

    private canUnlockFocusedTile(tile: HexTileState): boolean {
        const focusTile = this.unlockCostFocusTile;
        if (!focusTile || this.money < this.hexCost) return false;
        return this.isUnlockCostTile(tile, focusTile);
    }

    private calculatePeriodicIncome(): number {
        return calculateIncome(this.tiles, 3);
    }

    private createUnlockCostItem(tile: HexTileState): Laya.Sprite {
        const worldPos = this.hexToWorld(tile.col, tile.row);
        const uiPos = this.projectWorldToUi(new Laya.Vector3(worldPos.x, this.getTileSurfaceY(worldPos) + 0.2, worldPos.z));
        const item = new Laya.Sprite();
        item.name = `UnlockCost_${tile.col}_${tile.row}`;
        item.width = 94;
        item.height = 38;
        item.mouseEnabled = false;
        const icon = new Laya.Image(this.coinIconPath);
        icon.name = `UnlockCostCoin_${tile.col}_${tile.row}`;
        icon.width = 38;
        icon.height = 38;
        icon.x = 0;
        icon.y = 0;
        item.addChild(icon);
        const label = new Laya.Label();
        label.name = `UnlockCostText_${tile.col}_${tile.row}`;
        label.text = `${this.hexCost}`;
        label.width = 58;
        label.height = 34;
        label.fontSize = 30;
        label.bold = true;
        label.align = "center";
        label.valign = "middle";
        label.color = this.money < this.hexCost ? "#FF3B30" : "#FFE15A";
        label.stroke = 5;
        label.strokeColor = "#1D252B";
        label.mouseEnabled = false;
        label.x = 42;
        label.y = 2;
        item.addChild(label);
        item.x = uiPos.x - item.width * 0.5;
        item.y = uiPos.y - item.height * 0.5;
        return item;
    }

    private projectWorldToUi(worldPos: Laya.Vector3): Laya.Vector2 {
        const camera = this.getMainCamera();
        const width = this.uiRoot.width || Laya.stage.width || 1080;
        const height = this.uiRoot.height || Laya.stage.height || 1920;
        const projected = new Laya.Vector3();
        const projector = camera as unknown as { worldToViewportPoint?: (position: Laya.Vector3, out: Laya.Vector3) => void };
        if (camera && typeof projector.worldToViewportPoint === "function") {
            projector.worldToViewportPoint(worldPos, projected);
            return new Laya.Vector2(projected.x, projected.y);
        }
        return new Laya.Vector2((worldPos.x / 9.8 + 0.5) * width, (worldPos.z / 16 + 0.48) * height);
    }

    private clearUnlockCostLabels(): void {
        for (const label of this.unlockCostLabels) label.destroy();
        this.unlockCostLabels.length = 0;
    }

    private updateBuildingSpawns(dt: number): void {
        for (const building of this.buildings) {
            if (building.category === "defense") continue;
            const result = tickSpawnCooldown(building.cooldown, dt, this.gameStarted && !this.pausedForCards && !this.finished);
            building.cooldown = result.state;
            for (let i = 0; i < result.spawnCount; i++) {
                if (building.category === "resource") this.money += building.goldPerCycle;
                if (building.category === "unit") this.spawnUnit(building.team, building.position, building.unitKind!);
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
                this.destroyUnit(unit);
                this.units.splice(i, 1);
                continue;
            }
            const opponent = this.findNearestOpponent(unit);
            unit.attackCooldown = Math.max(0, unit.attackCooldown - dt);
            if (opponent && Laya.Vector3.distance(unit.node.transform.position, opponent.node.transform.position) < unit.range) {
                if (unit.attackCooldown <= 0) {
                    opponent.hp -= unit.damage;
                    unit.attackCooldown = 0.7;
                    this.playHitSound();
                }
                this.paintTileByUnitPresence(unit);
                continue;
            }
            const target = unit.team === "player" ? this.enemyBase.transform.position : this.playerBase.transform.position;
            if (Laya.Vector3.distance(unit.node.transform.position, target) < 1.1) {
                if (unit.team === "player") this.enemyBaseHp -= unit.damage * dt;
                else this.playerBaseHp -= unit.damage * dt;
                this.paintTileByUnitPresence(unit);
                continue;
            }
            this.moveToward(unit.node, target, unit.speed * dt);
            this.paintTileByUnitPresence(unit);
        }
    }

    private destroyUnit(unit: BattleUnit): void {
        unit.hpBar.destroy();
        unit.node.destroy();
    }

    private updateUnitHpBars(): void {
        for (const unit of this.units) this.updateUnitHpBar(unit);
    }

    private updateBuildingHpBars(): void {
        for (const building of this.buildings) this.updateBuildingHpBar(building);
    }

    private removeDestroyedBuildings(): void {
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            const building = this.buildings[i];
            if (this.getBuildingCurrentHp(building) > 0 && !building.node.destroyed) continue;
            building.progressSprite.destroy();
            building.hpBar.destroy();
            if (!building.node.destroyed) building.node.destroy();
            this.buildings.splice(i, 1);
        }
    }

    private getAliveBuildingCount(team: Team): number {
        return this.buildings.filter((building) => building.team === team && this.getBuildingCurrentHp(building) > 0 && !building.node.destroyed).length;
    }

    private resolveBuildingElimination(): boolean {
        const playerBuildings = this.getAliveBuildingCount("player");
        const enemyBuildings = this.getAliveBuildingCount("enemy");
        if (playerBuildings <= 0 && enemyBuildings <= 0) {
            this.finishGame(this.countOwnedTiles("player") >= this.countOwnedTiles("enemy"), this.countOwnedTiles("player") >= this.countOwnedTiles("enemy") ? "player" : "enemy");
            return true;
        }
        if (playerBuildings <= 0) {
            this.finishGame(false, "enemy");
            return true;
        }
        if (enemyBuildings <= 0) {
            this.finishGame(true, "player");
            return true;
        }
        return false;
    }

    private resolveTimedVictory(): boolean {
        const playerTiles = this.countOwnedTiles("player");
        const enemyTiles = this.countOwnedTiles("enemy");
        const playerWon = playerTiles >= enemyTiles;
        this.finishGame(playerWon, playerWon ? "player" : "enemy");
        return true;
    }

    private countOwnedTiles(owner: Team): number {
        return this.tiles.filter((tile) => tile.owner === owner).length;
    }

    private updateBuildingHpBar(building: SpawnBuilding): void {
        const bar = building.hpBar;
        const hp = this.getBuildingCurrentHp(building);
        if (building.node.destroyed || hp <= 0) {
            bar.visible = false;
            return;
        }
        const pos = building.node.transform.position;
        const uiPos = this.projectWorldToUi(new Laya.Vector3(pos.x, pos.y + 1.16, pos.z));
        this.drawEntityHpBar(bar, uiPos, hp, BUILDING_MAX_HP, building.team, "BuildingHpBarFill", "BuildingHpBarText", 34 * this.getUiScaleY());
    }

    private getBuildingCurrentHp(building: SpawnBuilding): number {
        if (building.node === this.playerBase) return this.playerBaseHp;
        if (building.node === this.enemyBase) return this.enemyBaseHp;
        return building.hp;
    }

    private updateUnitHpBar(unit: BattleUnit): void {
        const bar = unit.hpBar;
        if (unit.node.destroyed) {
            bar.visible = false;
            return;
        }
        const pos = unit.node.transform.position;
        const uiPos = this.projectWorldToUi(new Laya.Vector3(pos.x, pos.y + 0.86, pos.z));
        this.drawEntityHpBar(bar, uiPos, unit.hp, unit.maxHp, unit.team, "UnitHpBarFill", "UnitHpBarText", 26 * this.getUiScaleY());
    }

    private drawEntityHpBar(bar: Laya.Sprite, uiPos: Laya.Vector2, hp: number, maxHp: number, team: Team, fillName: string, textName: string, yOffset: number): void {
        bar.visible = this.uiMode === "battle";
        bar.x = uiPos.x - bar.width * 0.5;
        bar.y = uiPos.y - yOffset;
        bar.graphics.clear();
        bar.graphics.drawRect(0, 0, bar.width, bar.height, "#111111");
        bar.graphics.drawRect(2 * this.getUiScaleX(), 2 * this.getUiScaleY(), bar.width - 4 * this.getUiScaleX(), bar.height - 4 * this.getUiScaleY(), "#4A1515");
        const ratio = Math.max(0, Math.min(1, hp / maxHp));
        const fill = bar.getChildByName(fillName) as Laya.Sprite | null;
        if (fill) {
            fill.graphics.clear();
            fill.graphics.drawRect(3 * this.getUiScaleX(), 3 * this.getUiScaleY(), (bar.width - 6 * this.getUiScaleX()) * ratio, bar.height - 6 * this.getUiScaleY(), team === "player" ? "#25F22C" : "#FF4E4E");
        }
        const text = bar.getChildByName(textName) as Laya.Label | null;
        if (text) text.text = `${Math.max(0, Math.ceil(hp))}`;
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

    private findNearestTileByWorld(position: Laya.Vector3): HexTileState | null {
        let best: HexTileState | null = null;
        let bestDistance = Number.MAX_VALUE;
        for (const tile of this.tiles) {
            const pos = this.hexToWorld(tile.col, tile.row);
            const distance = Math.abs(pos.x - position.x) + Math.abs(pos.z - position.z);
            if (distance < bestDistance) {
                bestDistance = distance;
                best = tile;
            }
        }
        return best;
    }

    private paintNeighborTilesFromBuilding(position: Laya.Vector3, team: Team): void {
        const centerTile = this.findNearestTileByWorld(position);
        if (!centerTile) return;
        for (const tile of this.tiles) {
            if (tile.kind === "void" || tile.kind === "water") continue;
            if (tile.col === centerTile.col && tile.row === centerTile.row) this.paintTileOwner(tile, team, true);
            else if (isAdjacent(centerTile.col, centerTile.row, tile.col, tile.row)) this.paintTileOwner(tile, team, true);
        }
    }

    private paintTileByUnitPresence(unit: BattleUnit): void {
        const tile = this.findNearestTileByWorld(unit.node.transform.position);
        if (!tile || tile.kind === "void" || tile.kind === "water") return;
        this.paintTileOwner(tile, this.resolveContestedTileColor(tile), false);
    }

    private resolveContestedTileColor(tile: HexTileState): Team | "neutral" {
        let hasPlayer = false;
        let hasEnemy = false;
        for (const unit of this.units) {
            if (unit.hp <= 0 || unit.node.destroyed) continue;
            const unitTile = this.findNearestTileByWorld(unit.node.transform.position);
            if (!unitTile || unitTile.col !== tile.col || unitTile.row !== tile.row) continue;
            if (unit.team === "player") hasPlayer = true;
            if (unit.team === "enemy") hasEnemy = true;
        }
        if (hasPlayer && hasEnemy) return "neutral";
        return hasPlayer ? "player" : hasEnemy ? "enemy" : tile.owner;
    }

    private paintTileOwner(tile: HexTileState, owner: Team | "neutral", force: boolean = false): void {
        const key = this.key(tile.col, tile.row);
        const now = Date.now();
        const lastPaintTime = this.tilePaintCooldowns.get(key) ?? 0;
        if (!force && now - lastPaintTime < TILE_PAINT_COOLDOWN_MS) return;
        if (tile.owner === owner) return;
        this.tilePaintCooldowns.set(key, now);
        this.tiles = this.tiles.map((item) => item.col === tile.col && item.row === tile.row ? { ...item, owner: owner } : item);
        this.updateTileVisual(tile.col, tile.row);
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
        if (!tile || !node) return;
        this.playTileUnlockFlip(node);
        const color = this.getTileColor(tile);
        node.meshRenderer.sharedMaterial = this.createTileSurfaceMaterial(color);
        this.setShadowCasting(node, this.enableProjectedShadows);
        this.setShadowReceiving(node, this.enableProjectedShadows);
        const matchedVisual = node.getChildByName("MatchedHexTileVisual") as Laya.Sprite3D | null;
        if (matchedVisual) this.applyModelTint(matchedVisual, color);
    }

    private playTileUnlockFlip(node: Laya.MeshSprite3D): void {
        Laya.Tween.clearAll(node.transform);
        const originalPosition = node.transform.position.clone();
        const originalY = node.transform.position.y;
        const originalRotation = node.transform.rotationEuler.clone();
        const originalRotationX = node.transform.localRotationEulerX;
        node.transform.position = new Laya.Vector3(originalPosition.x, originalY, originalPosition.z);
        node.transform.rotationEuler = originalRotation;
        Laya.Tween.to(node.transform, { localPositionY: originalY + TILE_UNLOCK_FLIGHT_HEIGHT, localRotationEulerX: originalRotationX + 180 }, TILE_UNLOCK_LAUNCH_MS, Laya.Ease.backOut, Laya.Handler.create(this, () => {
            Laya.Tween.to(node.transform, { localRotationEulerX: originalRotationX + TILE_UNLOCK_ROTATION_DEGREES }, TILE_UNLOCK_SPIN_MS, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                Laya.Tween.to(node.transform, { localPositionY: originalY }, TILE_UNLOCK_LAND_MS, Laya.Ease.quadIn, Laya.Handler.create(this, () => {
                    node.transform.position = originalPosition;
                    node.transform.rotationEuler = originalRotation;
                }));
            }));
        }));
    }

    private playVictoryTileSpread(winner: Team): void {
        for (const tile of this.tiles) {
            const delay = this.getVictorySpreadDelay(tile, winner);
            Laya.timer.once(delay, this, () => {
                this.tiles = this.tiles.map((item) => item.col === tile.col && item.row === tile.row ? { ...item, owner: winner } : item);
                const node = this.tilesByKey.get(this.key(tile.col, tile.row));
                if (!node) return;
                this.updateTileVisual(tile.col, tile.row);
                this.playTileUnlockFlip(node);
            });
        }
    }

    private getVictorySpreadDelay(tile: HexTileState, winner: Team): number {
        const originRow = winner === "player" ? 8 : 1;
        return Math.round((Math.abs(tile.row - originRow) + Math.abs(tile.col - 3) * 0.35) * VICTORY_SPREAD_STEP_MS);
    }

    private refreshHud(): void {
        this.timerLabel.text = `${Math.ceil(this.remainingTime)}`;
        this.moneyLabel.text = `     ${Math.floor(this.money)}`;
        Laya.stage.event(GameEvents.MONEY_CHANGED, { money: this.money });
        Laya.stage.event(GameEvents.TIMER_CHANGED, { seconds: this.remainingTime });
    }

    private finishGame(victory: boolean, winner: Team): void {
        this.finished = true;
        this.setFirstTapPromptVisible(false);
        this.updateHpBars();
        this.setUiMode("result");
        this.playVictoryTileSpread(winner);
        this.drawResultPanelArt(victory);
        this.resultPanel.visible = true;
        this.ctaButton.visible = true;
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
        return new Laya.Vector3(x, this.getTileElevation(row), z);
    }

    private getTileElevation(row: number): number {
        return (4.5 - row) * HEX_ROW_ELEVATION_STEP;
    }

    private getTileSurfaceY(position: Laya.Vector3): number {
        return position.y + GROUND_SURFACE_Y;
    }

    private getModelBaseY(position: Laya.Vector3): number {
        return this.getTileSurfaceY(position) + 0.04;
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
        const uiPos = this.projectWorldToUi(new Laya.Vector3(position.x, this.getTileSurfaceY(position) + 0.2, position.z));
        sprite.x = uiPos.x - SPAWN_PROGRESS_SIZE * 0.5;
        sprite.y = uiPos.y - SPAWN_PROGRESS_SIZE * 0.5;
    }

    private drawSpawnProgress(building: SpawnBuilding): void {
        const sprite = building.progressSprite;
        this.positionProgressSprite(sprite, building.position);
        const fill = sprite.getChildByName("SpawnProgressFill") as Laya.Image | null;
        if (!fill) return;
        let mask = fill.mask as Laya.Sprite | null;
        if (!mask) {
            mask = new Laya.Sprite();
            mask.name = "SpawnProgressFillMask";
            mask.mouseEnabled = false;
            fill.mask = mask;
        }
        if (fill.mask !== mask) fill.mask = mask;
        const progress = Math.max(0, Math.min(1, building.cooldown.progress));
        mask.graphics.clear();
        mask.graphics.drawPie(SPAWN_PROGRESS_SIZE * 0.5, SPAWN_PROGRESS_SIZE * 0.5, SPAWN_PROGRESS_FILL_MASK_RADIUS, -90, -90 + progress * 360, "#FFFFFF");
    }

    private getTileColor(tile: HexTileState): string {
        if (tile.owner === "player") return COLOR_PLAYER_TILE;
        if (tile.owner === "enemy") return COLOR_ENEMY_TILE;
        if (tile.kind === "water") return COLOR_WATER;
        if (tile.kind === "lava") return COLOR_LAVA_TILE;
        if (tile.kind === "void") return COLOR_VOID_TILE;
        return COLOR_NEUTRAL_TILE;
    }

    private createMaterial(hex: string): Laya.UnlitMaterial {
        const material = new Laya.UnlitMaterial();
        material.albedoColor = this.colorFromHex(hex);
        material.albedoIntensity = 1;
        return material;
    }

    private createTileSurfaceMaterial(hex: string): Laya.Material {
        if (!this.enableProjectedShadows) return this.createMaterial(hex);
        const material = new Laya.BlinnPhongMaterial();
        material.albedoColor = this.colorFromHex(hex);
        material.albedoIntensity = 1;
        material.specularColor = new Laya.Color(0.05, 0.05, 0.05, 1);
        material.shininess = 0.08;
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
type BuildingCategory = "defense" | "resource" | "unit";
type UnitKind = "spear" | "archer" | "cavalry";
type BuildingKind = "tower" | "goldMine" | "spearBarracks" | "archerBarracks" | "cavalryBarracks";
type CardId = "arrowTower" | "goldMine" | "spearBarracks" | "archerBarracks" | "cavalryBarracks";

interface UnitStats {
    hp: number;
    damage: number;
    speed: number;
    range: number;
}

interface BattleUnit {
    team: Team;
    kind: UnitKind;
    node: Laya.Sprite3D;
    hp: number;
    maxHp: number;
    damage: number;
    speed: number;
    range: number;
    attackCooldown: number;
    hpBar: Laya.Sprite;
}

interface SpawnBuilding {
    kind: BuildingKind;
    category: BuildingCategory;
    team: Team;
    position: Laya.Vector3;
    cooldown: SpawnCooldownState;
    progressSprite: Laya.Sprite;
    hp: number;
    attackCooldown: number;
    node: Laya.Sprite3D;
    unitKind?: UnitKind;
    goldPerCycle: number;
    hpBar: Laya.Sprite;
}

interface UiLayers {
    hud: Laya.Sprite;
    worldOverlay: Laya.Sprite;
    guide: Laya.Sprite;
    modal: Laya.Sprite;
    result: Laya.Sprite;
}

interface PrefabFactory {
    create: () => Laya.Sprite3D;
}

interface BoundsLike {
    getExtent?: () => Laya.Vector3;
    min?: Laya.Vector3;
    max?: Laya.Vector3;
}

interface RendererLike {
    bounds?: BoundsLike;
    localBounds?: BoundsLike;
    sharedMaterial?: Laya.Material;
    sharedMaterials?: Laya.Material[];
    castShadow?: boolean;
    receiveShadow?: boolean;
}
