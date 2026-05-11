import { GameEvents } from "../data/GameEvents";
import { HexTileState, calculateIncome, canClaimTile, claimTile, createInitialHexGrid, isAdjacent } from "../data/HexRules";
import { SpawnCooldownState, createSpawnCooldown, tickSpawnCooldown } from "../data/SpawnCooldown";

const { regClass, property } = Laya;
const HEX_TILE_RADIUS = 0.82;
const HEX_TILE_HEIGHT = 0.32;
const HEX_OUTLINE_Y = 0.18;
const GROUND_SURFACE_Y = HEX_TILE_HEIGHT * 0.5;
const MODEL_BASE_Y = GROUND_SURFACE_Y + 0.04;
const HEX_X_STEP = 1.42;
const HEX_ROW_X_OFFSET = 0.71;
const HEX_Z_STEP = 1.23;
const BUILDING_FOOTPRINT = 0.42;
const BASE_VISUAL_SCALE = 0.45;
const MODEL_TILE_SCALE_CAP = 0.42;
const MODEL_FOOTPRINT_LIMIT = HEX_TILE_RADIUS * 1.15;
const UNIT_FOOTPRINT_LIMIT = HEX_TILE_RADIUS * 0.58;
const OPENING_TILE_COL = 3;
const OPENING_TILE_ROW = 7;
const WATER_FLOOR_SIZE = 18;
const WATER_FLOOR_Y = -0.22;
const BUILDING_MAX_HP = 100;
const TOWER_ATTACK_RANGE = 3.2;
const TOWER_ATTACK_INTERVAL = 1.1;
const TOWER_DAMAGE = 12;
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;
const BASE_HP_MAX = 100;

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
    @property({ type: String }) public baseBuildingPrefabPath: string = "match/模型资产/建筑/building_045_FGH_主楼/building_045_FGH_Main.fbx";
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
    @property({ type: Number }) public initialMoney: number = 20;
    @property({ type: Number }) public hexCost: number = 25;
    @property({ type: Number }) public timerCount: number = 80;
    @property({ type: Number }) public incomeInterval: number = 3;
    @property({ type: Number }) public spawnRate: number = 3;
    @property({ type: Number }) public redirectTouchCount: number = 5;
    @property({ type: Number }) public goldSupplyAmount: number = 35;
    @property({ type: Number }) public buildingModelScale: number = 0.28;
    @property({ type: Number }) public baseBuildingModelScale: number = 0.28;
    @property({ type: Number }) public towerModelScale: number = 0.28;
    @property({ type: Number }) public barracksModelScale: number = 0.28;
    @property({ type: Number }) public dragonNestModelScale: number = 0.28;
    @property({ type: Number }) public soldierModelScale: number = 0.22;
    @property({ type: Number }) public bossModelScale: number = 0.2;
    @property({ type: Number }) public tileModelScale: number = 0.42;
    @property({ type: Boolean }) public showDebugLayerLabels: boolean = false;

    private readonly cardDeck: CardId[] = ["arrowTower", "barracks", "goldSupply", "dragonNest"];
    private readonly cols: number = 7;
    private readonly rows: number = 10;
    private readonly tilesByKey: Map<string, Laya.MeshSprite3D> = new Map();
    private readonly debugLayerLabels: Laya.Label[] = [];
    private readonly unlockCostLabels: Laya.Sprite[] = [];
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
    private pendingInitialBuildPosition: Laya.Vector3 | null = null;
    private unlockCostFocusTile: HexTileState | null = null;
    private walletCoinIcon?: Laya.Image;
    private firstTapHighlight?: Laya.Sprite;
    private firstTapHand?: Laya.Image;
    private playerHpBar?: Laya.Sprite;
    private enemyHpBar?: Laya.Sprite;
    private uiLayers?: UiLayers;
    private uiMode: UiMode = "tutorial";

    onAwake(): void {
        this.money = this.initialMoney;
        this.remainingTime = this.timerCount;
        this.tiles = createInitialHexGrid(this.cols, this.rows);
        this.tiles = claimTile(this.tiles, OPENING_TILE_COL, OPENING_TILE_ROW);
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
            this.updateUnlockCostLabels();
            this.refreshHud();
        }
        this.updateBuildingSpawns(dt);
        this.updateTowerAttacks(dt);
        this.updateUnits(dt);
        this.updateHpBars();
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
        this.clearUnlockCostLabels();
        this.walletCoinIcon?.destroy();
        this.firstTapHighlight?.destroy();
        this.firstTapHand?.destroy();
        this.playerHpBar?.destroy();
        this.enemyHpBar?.destroy();
        for (const building of this.buildings) building.progressSprite.destroy();
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
        camera.transform.position = new Laya.Vector3(0, 12.2, 9.4);
        camera.transform.rotationEuler = new Laya.Vector3(-57, 0, 0);
    }

    private setupLighting(): void {
        const scene3D = this.getScene3D() as (Laya.Scene3D & { ambientColor?: Laya.Color }) | null;
        if (scene3D) scene3D.ambientColor = new Laya.Color(0.62, 0.68, 0.72, 1);
        const lightNode = scene3D?.getChildByName("Direction Light") as Laya.Sprite3D | null;
        const light = lightNode?.getComponent(Laya.DirectionLightCom) as (Laya.DirectionLightCom & { intensity?: number }) | null;
        if (!light) return;
        light.color = new Laya.Color(1, 0.95, 0.82, 1);
        light.intensity = 1.6;
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
        node.meshRenderer.sharedMaterial = this.createMaterial(this.getTileColor(tile));
        node.transform.position = this.hexToWorld(tile.col, tile.row);
        node.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
        node.addChild(this.createHexSideShadow(tile));
        this.createHexTileVisual(node, tile);
        node.addChild(this.createHexOutline(tile));
        return node;
    }

    private createHexSideShadow(tile: HexTileState): Laya.MeshSprite3D {
        const shadow = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createCylinder(HEX_TILE_RADIUS * 1.01, HEX_TILE_HEIGHT * 0.82, 6), `HexSideShadow_${tile.col}_${tile.row}`);
        shadow.meshRenderer.sharedMaterial = this.createMaterial("#4A5556");
        shadow.transform.localPosition = new Laya.Vector3(0, -0.055, 0);
        shadow.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
        return shadow;
    }

    private createHexTileVisual(parent: Laya.Sprite3D, tile: HexTileState): void {
        if (!this.hexTilePrefabPath) return;
        const container = new Laya.Sprite3D("MatchedHexTileVisual");
        parent.addChild(container);
        this.createPrefabVisual(container, this.hexTilePrefabPath, new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.tileModelScale), this.getTileColor(tile), MODEL_FOOTPRINT_LIMIT);
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
        base.transform.position = new Laya.Vector3(tilePos.x, MODEL_BASE_Y, tilePos.z);
        base.transform.localScale = new Laya.Vector3(BASE_VISUAL_SCALE, BASE_VISUAL_SCALE, BASE_VISUAL_SCALE);
        this.setupBaseComposite(base, base === this.enemyBase ? "enemy" : "player");
    }

    private setupBaseComposite(base: Laya.Sprite3D, team: Team): void {
        base.destroyChildren();
        const tileVisual = new Laya.Sprite3D("BaseTileVisual");
        tileVisual.transform.localPosition = new Laya.Vector3(0, -MODEL_BASE_Y, 0);
        base.addChild(tileVisual);
        this.createPrefabVisual(tileVisual, this.hexTilePrefabPath, new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.tileModelScale), team === "player" ? "#82E03A" : "#FF3333", MODEL_FOOTPRINT_LIMIT);

        const buildingVisual = new Laya.Sprite3D("BaseBuildingVisual");
        buildingVisual.transform.localPosition = new Laya.Vector3(0, 0, 0);
        base.addChild(buildingVisual);
        this.createPrefabVisual(buildingVisual, this.baseBuildingPrefabPath, new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.baseBuildingModelScale), team === "player" ? "#82E03A" : "#FF3333", MODEL_FOOTPRINT_LIMIT);
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
        this.setDesignRect(this.moneyLabel, 835, 58, 200, 76);
        this.moneyLabel.fontSize = this.scaleFont(38);
        this.moneyLabel.bold = true;
        this.moneyLabel.align = "center";
        this.moneyLabel.valign = "middle";
        this.moneyLabel.color = "#FFF4CA";
        this.moneyLabel.stroke = 5;
        this.moneyLabel.strokeColor = "#111111";
        (this.moneyLabel as Laya.Label & { bgColor?: string }).bgColor = "#332B5C";
        this.walletCoinIcon = this.getOrCreateImage(parent, "WalletCoinIcon", this.coinIconPath, this.walletCoinIcon);
        this.setDesignRect(this.walletCoinIcon, 852, 75, 42, 42);
        this.walletCoinIcon.visible = true;
        parent.setChildIndex(this.walletCoinIcon, Math.max(0, parent.getChildIndex(this.moneyLabel)));
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
        this.setDesignRect(this.resultPanel, 80, 610, 920, 560);
        this.setDesignRect(this.resultCtaButton, 260, 360, 400, 110);
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
        const uiPos = this.projectWorldToUi(new Laya.Vector3(worldPos.x, GROUND_SURFACE_Y + 0.24, worldPos.z));
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
        if (!this.playerHpBar) this.playerHpBar = this.createHpBar("PlayerHpBar");
        if (!this.enemyHpBar) this.enemyHpBar = this.createHpBar("EnemyHpBar");
        this.updateHpBar(this.playerHpBar, this.playerBase, this.playerBaseHp, this.gameStarted && this.playerBase.active);
        this.updateHpBar(this.enemyHpBar, this.enemyBase, this.enemyBaseHp, this.gameStarted && this.enemyBase.active);
    }

    private updateHpBar(bar: Laya.Sprite, target: Laya.Sprite3D, hp: number, visible: boolean): void {
        bar.visible = visible;
        if (!visible) return;
        const position = target.transform.position;
        const uiPos = this.projectWorldToUi(new Laya.Vector3(position.x, MODEL_BASE_Y + 0.96, position.z));
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
        if (!canClaimTile(this.tiles, tile.col, tile.row, this.money, this.hexCost, this.firstClaim)) {
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
        this.activateInitialBase(this.enemyBase, this.hexToWorld(3, 1), "enemy");
        this.setFirstTapPromptVisible(false);
        this.updateHpBars();
        this.setUiMode("battle");
        this.hintLabel.text = "建筑已建成，点击金币解锁相邻地块！";
    }

    private activateInitialBase(base: Laya.Sprite3D, position: Laya.Vector3, team: Team): void {
        base.active = true;
        base.transform.position = new Laya.Vector3(position.x, MODEL_BASE_Y, position.z);
        base.transform.localScale = new Laya.Vector3(BASE_VISUAL_SCALE, BASE_VISUAL_SCALE, BASE_VISUAL_SCALE);
        this.setupBaseComposite(base, team);
        const progressSprite = this.createSpawnProgressSprite(base.transform.position, team);
        this.buildings.push({ kind: "barracks", team, position: base.transform.position.clone(), cooldown: createSpawnCooldown(this.spawnRate), progressSprite, hp: BUILDING_MAX_HP, attackCooldown: 0, node: base });
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
        const choices = [0, 1, 2].map((offset) => this.cardDeck[(this.nextCardStart + offset) % this.cardDeck.length]);
        this.nextCardStart = (this.nextCardStart + 1) % this.cardDeck.length;
        return choices;
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
        description.color = cardId === "goldSupply" ? "#FFE66A" : "#FFF4C8";
    }

    private getCardOptionTitle(cardId: CardId): string {
        if (cardId === "arrowTower") return "箭塔";
        if (cardId === "barracks") return "枪兵";
        if (cardId === "goldSupply") return "金矿";
        return "箭塔";
    }

    private getCardOptionDescription(cardId: CardId): string {
        if (cardId === "arrowTower") return "远程压制";
        if (cardId === "barracks") return "持续出兵";
        if (cardId === "goldSupply") return `金币 +${this.goldSupplyAmount}`;
        return "召唤强援";
    }

    private getCardOptionAccent(cardId: CardId): string {
        if (cardId === "arrowTower") return "#F6D348";
        if (cardId === "barracks") return "#80DC38";
        if (cardId === "goldSupply") return "#FFE05D";
        return "#FF8A2A";
    }

    private getCardOptionFaceColor(cardId: CardId): string {
        if (cardId === "arrowTower") return "#E6B335";
        if (cardId === "barracks") return "#9B41D1";
        if (cardId === "goldSupply") return "#3BBF28";
        return "#F3C44D";
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
        if (cardId === "goldSupply") {
            this.money += this.goldSupplyAmount;
            this.createBuildingMarker(position, "goldMine", "player", buildSlot);
        } else if (cardId === "dragonNest") {
            this.spawnUnit("player", position, true);
            this.createBuildingMarker(position, "dragon", "player", buildSlot);
        } else if (cardId === "barracks") {
            this.createBuildingMarker(position, "barracks", "player", buildSlot);
        } else {
            this.createBuildingMarker(position, "tower", "player", buildSlot);
        }
        if (!this.gameStarted) this.startBattleAfterInitialCard(position);
        this.pendingInitialBuildPosition = null;
        this.updateUnlockCostLabels();
        this.setUiMode("battle");
        this.hintLabel.text = "点击金币图标，花费金币解锁相邻地块";
        this.refreshHud();
    }

    private createSpawnProgressSprite(position: Laya.Vector3, team: Team): Laya.Sprite {
        const parent = this.uiLayers?.worldOverlay ?? this.uiRoot;
        const sprite = new Laya.Sprite();
        sprite.name = `${team}_SpawnProgress_${this.buildings.length}`;
        sprite.mouseEnabled = false;
        parent.addChild(sprite);
        this.positionProgressSprite(sprite, position);
        return sprite;
    }

    private createBuildingMarker(position: Laya.Vector3, kind: BuildingKind, team: Team = "player", slot?: Laya.Sprite3D): void {
        const node = slot ?? new Laya.Sprite3D(`${team}_${kind}_${this.buildings.length}`);
        node.name = slot ? `InitialBuildSlot_${kind}` : node.name;
        const color = this.getBuildingColor(kind, team);
        node.transform.position = new Laya.Vector3(position.x, MODEL_BASE_Y, position.z);
        if (!node.parent) this.buildingsRoot.addChild(node);
        else node.destroyChildren();
        this.addFallbackBuildingVisual(node, kind, color);
        this.createPrefabVisual(node, this.getBuildingPrefabPath(kind), new Laya.Vector3(0, 0, 0), this.getModelScaleVector(this.getBuildingModelScale(kind)), color, MODEL_FOOTPRINT_LIMIT);
        const progressSprite = this.createSpawnProgressSprite(node.transform.position, team);
        this.buildings.push({ kind, team, position: node.transform.position.clone(), cooldown: createSpawnCooldown(this.spawnRate), progressSprite, hp: BUILDING_MAX_HP, attackCooldown: 0, node });
    }

    private spawnUnit(team: Team, position: Laya.Vector3, strong: boolean): void {
        const node = new Laya.Sprite3D(`${team}_${strong ? "dragon" : "soldier"}_${this.units.length}`);
        node.transform.position = new Laya.Vector3(position.x, MODEL_BASE_Y + 0.42, position.z);
        this.unitsRoot.addChild(node);
        this.addFallbackUnitVisual(node, team, strong);
        this.createPrefabVisual(node, strong ? this.dragonPrefabPath : this.soldierPrefabPath, new Laya.Vector3(0, -0.58, 0), this.getModelScaleVector(strong ? this.bossModelScale : this.soldierModelScale), this.getUnitColor(team, strong), UNIT_FOOTPRINT_LIMIT);
        this.units.push({ team, node, hp: strong ? 140 : team === "player" ? 40 : 100, damage: strong ? 16 : team === "player" ? 5 : 10, speed: strong ? 2.4 : team === "player" ? 3 : 4, attackCooldown: 0 });
    }

    private getBuildingColor(kind: BuildingKind, team: Team): string {
        if (team === "enemy") return "#FF3333";
        if (kind === "goldMine") return "#FFE15A";
        if (kind === "dragon") return "#FF7A1A";
        if (kind === "tower") return "#F8D34C";
        return "#82E03A";
    }

    private getUnitColor(team: Team, strong: boolean): string {
        if (team === "enemy") return strong ? "#D51B28" : "#FF3333";
        return strong ? "#24D7FF" : "#4DEB7A";
    }

    private getBuildingModelScale(kind: BuildingKind): number {
        if (kind === "tower") return this.towerModelScale;
        if (kind === "barracks") return this.barracksModelScale;
        if (kind === "goldMine") return this.barracksModelScale;
        return this.dragonNestModelScale;
    }

    private getBuildingPrefabPath(kind: BuildingKind): string {
        if (kind === "tower") return this.towerPrefabPath;
        if (kind === "barracks") return this.barracksPrefabPath;
        if (kind === "goldMine") return this.barracksPrefabPath;
        return this.dragonNestPrefabPath;
    }

    private addFallbackBuildingVisual(node: Laya.Sprite3D, kind: BuildingKind, color: string): void {
        const visual = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(BUILDING_FOOTPRINT, kind === "tower" ? 0.95 : 0.56, BUILDING_FOOTPRINT), "FallbackBuildingVisual");
        visual.meshRenderer.sharedMaterial = this.createMaterial(color);
        visual.transform.localPosition = new Laya.Vector3(0, kind === "tower" ? 0.48 : 0.28, 0);
        node.addChild(visual);
    }

    private addFallbackUnitVisual(node: Laya.Sprite3D, team: Team, strong: boolean): void {
        const mesh = Laya.PrimitiveMesh.createCapsule(strong ? 0.35 : 0.24, strong ? 1.2 : 0.8);
        const visual = new Laya.MeshSprite3D(mesh, "FallbackUnitVisual");
        visual.meshRenderer.sharedMaterial = this.createMaterial(team === "player" ? "#4DEB7A" : "#FF3333");
        node.addChild(visual);
    }

    private createPrefabVisual(parent: Laya.Sprite3D, path: string, localPosition: Laya.Vector3, localScale: Laya.Vector3, tintColor: string, footprintLimit: number): void {
        if (!path) return;
        void Laya.loader.load(path, Laya.Loader.HIERARCHY).then((prefab: Laya.Sprite3D | PrefabFactory | null) => {
            if (!prefab || parent.destroyed) return;
            try {
                const visual = this.createPrefabInstance(prefab);
                if (!visual || parent.destroyed) return;
                visual.name = "MatchedPrefabVisual";
                visual.transform.localPosition = localPosition;
                visual.transform.localScale = localScale;
                this.applyModelTint(visual, tintColor);
                this.fitPrefabToTile(visual, footprintLimit);
                parent.destroyChildren();
                parent.addChild(visual);
            } catch (error) {
                console.warn(`Failed to instantiate prefab visual: ${path}`, error);
            }
        });
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
        const stack: Laya.Node[] = [root];
        while (stack.length > 0) {
            const node = stack.pop()!;
            const mesh = node as Laya.MeshSprite3D;
            const renderer = mesh.meshRenderer as (Laya.MeshRenderer & { bounds?: BoundsLike }) | undefined;
            const bounds = renderer?.bounds;
            const footprint = this.getBoundsFootprint(bounds);
            if (footprint > maxFootprint) maxFootprint = footprint;
            for (let i = 0; i < node.numChildren; i++) stack.push(node.getChildAt(i));
        }
        return maxFootprint;
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
            const mesh = node as Laya.MeshSprite3D;
            const renderer = mesh.meshRenderer as (Laya.MeshRenderer & { sharedMaterial?: Laya.Material; sharedMaterials?: Laya.Material[] }) | undefined;
            if (renderer) {
                renderer.sharedMaterial = tintMaterial;
                renderer.sharedMaterials = [tintMaterial];
            }
            for (let i = 0; i < node.numChildren; i++) stack.push(node.getChildAt(i));
        }
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

    private createUnlockCostItem(tile: HexTileState): Laya.Sprite {
        const worldPos = this.hexToWorld(tile.col, tile.row);
        const uiPos = this.projectWorldToUi(new Laya.Vector3(worldPos.x, GROUND_SURFACE_Y + 0.2, worldPos.z));
        const item = new Laya.Sprite();
        item.name = `UnlockCost_${tile.col}_${tile.row}`;
        item.width = 94;
        item.height = 38;
        item.mouseEnabled = false;
        const icon = new Laya.Image(this.coinIconPath);
        icon.name = `UnlockCostCoin_${tile.col}_${tile.row}`;
        icon.width = 34;
        icon.height = 34;
        icon.x = 0;
        icon.y = 2;
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
        label.x = 36;
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
            if (building.kind === "tower" || building.kind === "goldMine") continue;
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
        if (!tile || !node) return;
        this.playTileUnlockFlip(node);
        const color = this.getTileColor(tile);
        node.meshRenderer.sharedMaterial = this.createMaterial(color);
        this.applyModelTint(node, color);
    }

    private playTileUnlockFlip(node: Laya.MeshSprite3D): void {
        node.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
        Laya.Tween.to(node.transform, { localRotationEulerY: 210 }, 140, Laya.Ease.backOut, Laya.Handler.create(this, () => {
            node.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
        }));
    }

    private refreshHud(): void {
        this.timerLabel.text = `${Math.ceil(this.remainingTime)}`;
        this.moneyLabel.text = `${Math.floor(this.money)}`;
        Laya.stage.event(GameEvents.MONEY_CHANGED, { money: this.money });
        Laya.stage.event(GameEvents.TIMER_CHANGED, { seconds: this.remainingTime });
    }

    private finishGame(victory: boolean): void {
        this.finished = true;
        this.setFirstTapPromptVisible(false);
        this.updateHpBars();
        this.setUiMode("result");
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
type BuildingKind = "tower" | "barracks" | "dragon" | "goldMine";
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
