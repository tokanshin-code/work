{
  "_$ver": 1,
  "_$id": "vkrlk1jf",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "Scene2D",
  "width": 1080,
  "height": 1920,
  "_$child": [
    {
      "_$id": "n9gjxcltvl",
      "_$type": "Scene3D",
      "name": "Scene3D",
      "skyRenderer": {
        "meshType": "dome",
        "material": {
          "_$uuid": "793cffc6-730a-4756-a658-efe98c230292",
          "_$type": "Material"
        }
      },
      "ambientColor": {
        "_$type": "Color",
        "r": 0.424308,
        "g": 0.4578516,
        "b": 0.5294118
      },
      "fogStart": 0,
      "fogColor": {
        "_$type": "Color",
        "r": 0.5,
        "g": 0.5,
        "b": 0.5
      },
      "_$child": [
        {
          "_$id": "6jx8h8bvc6",
          "_$type": "Camera",
          "name": "Main Camera",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "y": 13,
              "z": 11
            },
            "localRotation": {
              "_$type": "Quaternion",
              "x": -0.4617486132350339,
              "w": 0.8870108331782217
            }
          },
          "orthographicVerticalSize": 14.8,
          "fieldOfView": 42,
          "nearPlane": 0.3,
          "farPlane": 1000,
          "clearFlag": 1,
          "clearColor": {
            "_$type": "Color",
            "r": 0.3921,
            "g": 0.5843,
            "b": 0.9294
          }
        },
        {
          "_$id": "6ni3p096l5",
          "_$type": "Sprite3D",
          "name": "Direction Light",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": 5,
              "y": 5,
              "z": 5
            },
            "localRotation": {
              "_$type": "Quaternion",
              "x": -0.40821789367673483,
              "y": 0.23456971600980447,
              "z": 0.109381654946615,
              "w": 0.875426098065593
            }
          },
          "_$comp": [
            {
              "_$type": "DirectionLightCom",
              "color": {
                "_$type": "Color",
                "r": 0.6,
                "g": 0.6,
                "b": 0.6
              }
            }
          ]
        },
        {
          "_$id": "l77bzsm6",
          "_$type": "Sprite3D",
          "name": "HexBoard",
          "_$comp": [
            {
              "_$type": "3c9e2068-0eee-4432-91fa-668b8e3659ea",
              "scriptPath": "../src/game/HexGameController.ts",
              "hexBoard": {
                "_$ref": "l77bzsm6"
              },
              "waterLayer": null,
              "basesRoot": {
                "_$ref": "hmtxejx8"
              },
              "buildingsRoot": {
                "_$ref": "r6j26egy"
              },
              "unitsRoot": {
                "_$ref": "kaq3k0ta"
              },
              "uiRoot": {
                "_$ref": "gl0efi1v"
              },
              "timerLabel": {
                "_$ref": "svtcmace"
              },
              "moneyLabel": {
                "_$ref": "tn6of286"
              },
              "hintLabel": {
                "_$ref": "3aetoxti"
              },
              "cardPanel": {
                "_$ref": "byt21aqx"
              },
              "cardButtonA": {
                "_$ref": "9agl3ots"
              },
              "cardButtonB": {
                "_$ref": "p5zyi812"
              },
              "cardButtonC": {
                "_$ref": "ub7ia4l5"
              },
              "resultPanel": {
                "_$ref": "syrvl1kr"
              },
              "resultTitle": {
                "_$ref": "oylx98l7"
              },
              "resultText": {
                "_$ref": "bf3mjwpf"
              },
              "ctaButton": {
                "_$ref": "5bko6yzn"
              },
              "resultCtaButton": {
                "_$ref": "ng9ochb5"
              },
              "playerBase": {
                "_$ref": "gtm62qlf"
              },
              "enemyBase": {
                "_$ref": "sxg8y9vr"
              },
              "defaultClickableTileMarker": null,
              "initialBuildSlot": null,
              "unlockCostLayer": null,
              "soldierPrefabPath": "match/绑定动画/SW_NPC_000_通用/SW_NPC_008_士兵@skin.lh",
              "dragonPrefabPath": "downloads/3d/dragon/Role_xiaohuangya_01.lh",
              "towerPrefabPath": "match/Models/GLB format/building-archery-unpacked/building-archery.lh",
              "barracksPrefabPath": "match/Models/GLB format/building-cabin-unpacked/building-cabin.lh",
              "dragonNestPrefabPath": "match/Models/GLB format/building-wizard-tower-unpacked/building-wizard-tower.lh",
              "baseBuildingPrefabPath": "match/Models/GLB format/building-castle-unpacked/building-castle.lh",
              "fireEffectPath": "match/3月新增资源/丧尸/PenHuoQi.fbx",
              "hitSoundPath": "downloads/2d/sfx/afedc1f409ba5418cc3ff2d6fdc64eca.mp3",
              "bgmPath": "downloads/2d/bgm/f93f9377dcad12be63b55fcad314858d.mp3",
              "waterTexturePath": "resources/water/water_surface.png",
              "hexTilePrefabPath": "match/Models/GLB format/grass.glb",
              "cardPanelSkinPath": "downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png",
              "cardOptionSkinPath": "downloads/2d/card_option/CardFrame_01_White_Bg.png",
              "resultPanelSkinPath": "downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png",
              "tutorialHintSkinPath": "downloads/2d/tutorial_hint/info.png",
              "coinIconPath": "downloads/2d/ui/coin_2.png",
              "cardIconPath": "downloads/2d/ui/card.png",
              "handIconPath": "downloads/2d/ui/hand.png",
              "initialMoney": 20,
              "hexCost": 25,
              "timerCount": 80,
              "incomeInterval": 3,
              "spawnRate": 3,
              "redirectTouchCount": 5,
              "goldSupplyAmount": 35,
              "buildingModelScale": 0.38,
              "baseBuildingModelScale": 0.38,
              "towerModelScale": 0.38,
              "barracksModelScale": 0.38,
              "dragonNestModelScale": 0.38,
              "soldierModelScale": 0.22,
              "bossModelScale": 0.2,
              "tileModelScale": 0.42,
              "showDebugLayerLabels": false
            }
          ],
          "_$child": [
            {
              "_$id": "utkwfu3x",
              "_$type": "Sprite3D",
              "name": "DefaultClickableTileMarker",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "y": 0.28
                }
              }
            }
          ]
        },
        {
          "_$id": "hmtxejx8",
          "_$type": "Sprite3D",
          "name": "Bases",
          "_$child": [
            {
              "_$id": "gtm62qlf",
              "_$type": "Sprite3D",
              "name": "PlayerBase",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "y": 0.15,
                  "z": 6.6
                },
                "localScale": {
                  "_$type": "Vector3",
                  "x": 1.4,
                  "y": 1.4,
                  "z": 1.4
                }
              }
            },
            {
              "_$id": "sxg8y9vr",
              "_$type": "Sprite3D",
              "name": "EnemyBase",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "y": 0.15,
                  "z": -6.6
                },
                "localScale": {
                  "_$type": "Vector3",
                  "x": 1.4,
                  "y": 1.4,
                  "z": 1.4
                }
              }
            }
          ]
        },
        {
          "_$id": "r6j26egy",
          "_$type": "Sprite3D",
          "name": "Buildings",
          "_$child": [
            {
              "_$id": "eqfuk5dw",
              "_$type": "Sprite3D",
              "name": "InitialBuildSlot"
            }
          ]
        },
        {
          "_$id": "kaq3k0ta",
          "_$type": "Sprite3D",
          "name": "Units"
        },
        {
          "_$id": "b8tt4spa",
          "_$type": "Sprite3D",
          "name": "WaterLayer",
          "_$child": [
            {
              "_$id": "watersurfacesample",
              "_$type": "Sprite3D",
              "name": "WaterSurfaceSample",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 0,
                  "y": -0.22,
                  "z": 0
                }
              }
            }
          ]
        },
        {
          "_$id": "edasset3d",
          "_$type": "Sprite3D",
          "name": "EditorAssetSamples",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": -5
            }
          },
          "_$child": [
            {
              "_$id": "hexassetsample",
              "_$prefab": "68b33dd6-c2fd-4de2-96ad-3a7049263801",
              "name": "HexTileAssetSample",
              "active": true,
              "layer": 0,
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "y": 0.2
                },
                "localRotation": {
                  "_$type": "Quaternion"
                },
                "localScale": {
                  "_$type": "Vector3",
                  "x": 0.42,
                  "y": 0.42,
                  "z": 0.42
                }
              }
            },
            {
              "_$id": "9n4u0agt",
              "_$prefab": "579f3e75-9418-40d5-9de8-65b7348a0153",
              "name": "BuildingScaleSample",
              "active": true,
              "layer": 0,
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 1.8,
                  "y": 0.2
                },
                "localRotation": {
                  "_$type": "Quaternion"
                },
                "localScale": {
                  "_$type": "Vector3",
                  "x": 0.28,
                  "y": 0.28,
                  "z": 0.28
                }
              }
            },
            {
              "_$id": "1wn5y285",
              "_$prefab": "81a11796-e527-4351-a44b-270e97b89ae4",
              "name": "SoldierScaleSample",
              "active": true,
              "layer": 0,
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 2.7068108293661455,
                  "y": 0.796118318808821
                },
                "localRotation": {
                  "_$type": "Quaternion"
                },
                "localScale": {
                  "_$type": "Vector3",
                  "x": 0.22,
                  "y": 0.22,
                  "z": 0.22
                }
              }
            },
            {
              "_$id": "oxlhmxh5",
              "_$prefab": "8b2d0c49-2b31-4ab1-b59c-2482e71aa7d6",
              "name": "BossScaleSample",
              "active": true,
              "layer": 0,
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 4.6,
                  "y": 0.2
                },
                "localRotation": {
                  "_$type": "Quaternion"
                },
                "localScale": {
                  "_$type": "Vector3",
                  "x": 0.0699995,
                  "y": 0.0199997,
                  "z": 0.2
                }
              }
            },
            {
              "_$id": "buildingsamples",
              "_$type": "Sprite3D",
              "name": "BuildingSamples",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 0,
                  "y": 0,
                  "z": 2.2
                }
              },
              "_$child": [
                {
                  "_$id": "basebuildingsample",
                  "name": "BaseBuildingSample",
                  "_$prefab": "253a179c-3e3a-45a6-8cde-b43c3d3ed205",
                  "transform": {
                    "localPosition": {
                      "_$type": "Vector3",
                      "x": 0,
                      "y": 0.2,
                      "z": 0
                    },
                    "localScale": {
                      "_$type": "Vector3",
                      "x": 0.28,
                      "y": 0.28,
                      "z": 0.28
                    }
                  }
                },
                {
                  "_$id": "towersample",
                  "name": "TowerSample",
                  "_$prefab": "579f3e75-9418-40d5-9de8-65b7348a0153",
                  "transform": {
                    "localPosition": {
                      "_$type": "Vector3",
                      "x": 1.4,
                      "y": 0.2,
                      "z": 0
                    },
                    "localScale": {
                      "_$type": "Vector3",
                      "x": 0.28,
                      "y": 0.28,
                      "z": 0.28
                    }
                  }
                },
                {
                  "_$id": "barrackssample",
                  "name": "BarracksSample",
                  "_$prefab": "60f8cc9b-8e6d-4cb5-8f41-3f60db48e622",
                  "transform": {
                    "localPosition": {
                      "_$type": "Vector3",
                      "x": 2.8,
                      "y": 0.2,
                      "z": 0
                    },
                    "localScale": {
                      "_$type": "Vector3",
                      "x": 0.28,
                      "y": 0.28,
                      "z": 0.28
                    }
                  }
                },
                {
                  "_$id": "dragonnestsample",
                  "name": "DragonNestSample",
                  "_$prefab": "579f3e75-9418-40d5-9de8-65b7348a0153",
                  "transform": {
                    "localPosition": {
                      "_$type": "Vector3",
                      "x": 4.2,
                      "y": 0.2,
                      "z": 0
                    },
                    "localScale": {
                      "_$type": "Vector3",
                      "x": 0.28,
                      "y": 0.28,
                      "z": 0.28
                    }
                  }
                },
                {
                  "_$id": "fireeffectsample",
                  "name": "FireEffectSample",
                  "_$prefab": "3cc351f1-6c0f-4fd9-a8ca-8edcb4321b6a",
                  "transform": {
                    "localPosition": {
                      "_$type": "Vector3",
                      "x": 5.6,
                      "y": 0.2,
                      "z": 0
                    },
                    "localScale": {
                      "_$type": "Vector3",
                      "x": 0.28,
                      "y": 0.28,
                      "z": 0.28
                    }
                  }
                }
              ]
            },
            {
              "_$id": "unitsamples",
              "_$type": "Sprite3D",
              "name": "UnitSamples",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 0,
                  "y": 0,
                  "z": 4.4
                }
              },
              "_$child": [
                {
                  "_$id": "soldierlayersample",
                  "name": "SoldierLayerSample",
                  "_$prefab": "81a11796-e527-4351-a44b-270e97b89ae4",
                  "transform": {
                    "localPosition": {
                      "_$type": "Vector3",
                      "x": 0,
                      "y": 0.2,
                      "z": 0
                    },
                    "localScale": {
                      "_$type": "Vector3",
                      "x": 0.22,
                      "y": 0.22,
                      "z": 0.22
                    }
                  }
                },
                {
                  "_$id": "bosslayersample",
                  "name": "BossLayerSample",
                  "_$prefab": "8b2d0c49-2b31-4ab1-b59c-2482e71aa7d6",
                  "transform": {
                    "localPosition": {
                      "_$type": "Vector3",
                      "x": 1.4,
                      "y": 0.2,
                      "z": 0
                    },
                    "localScale": {
                      "_$type": "Vector3",
                      "x": 0.2,
                      "y": 0.2,
                      "z": 0.2
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "_$id": "gl0efi1v",
      "_$type": "Box",
      "name": "GameUIRoot",
      "width": 1080,
      "height": 1920,
      "_$child": [
        {
          "_$id": "svtcmace",
          "_$type": "Label",
          "name": "TimerLabel",
          "x": 48,
          "y": 36,
          "width": 220,
          "height": 80,
          "text": "80",
          "fontSize": 54,
          "color": "#FFFFFF",
          "stroke": 5,
          "strokeColor": "#243447"
        },
        {
          "_$id": "tn6of286",
          "_$type": "Label",
          "name": "MoneyLabel",
          "x": 820,
          "y": 42,
          "width": 220,
          "height": 72,
          "text": "20",
          "fontSize": 48,
          "color": "#FFE46B",
          "align": "right",
          "stroke": 5,
          "strokeColor": "#3A2500"
        },
        {
          "_$id": "3aetoxti",
          "_$type": "Label",
          "name": "HintLabel",
          "x": 120,
          "y": 240,
          "width": 840,
          "height": 90,
          "text": "点击相邻地块扩张领地",
          "fontSize": 48,
          "color": "#FFFFFF",
          "align": "center",
          "stroke": 6,
          "strokeColor": "#13231A"
        },
        {
          "_$id": "byt21aqx",
          "_$type": "Box",
          "name": "CardChoicePanel",
          "x": 60,
          "y": 1080,
          "width": 960,
          "height": 420,
          "visible": false,
          "_$child": [
            {
              "_$id": "cardpanelsample",
              "_$type": "Image",
              "name": "CardPanelAssetSample",
              "width": 960,
              "height": 420,
              "skin": "downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png",
              "sizeGrid": "24,24,24,24,0",
              "color": "#ffffff"
            },
            {
              "_$id": "cardoptionsample",
              "_$type": "Image",
              "name": "CardOptionAssetSample",
              "x": 30,
              "y": 100,
              "width": 280,
              "height": 260,
              "skin": "downloads/2d/card_option/CardFrame_01_White_Bg.png",
              "sizeGrid": "24,24,24,24,0",
              "color": "#ffffff"
            },
            {
              "_$id": "3dica8rl",
              "_$type": "Label",
              "name": "CardTitle",
              "width": 960,
              "height": 80,
              "text": "选择一张卡牌强化防线",
              "fontSize": 44,
              "color": "#FFFFFF",
              "align": "center",
              "stroke": 5,
              "strokeColor": "#1D2733"
            },
            {
              "_$id": "9agl3ots",
              "_$type": "Button",
              "name": "CardButtonA",
              "x": 30,
              "y": 100,
              "width": 280,
              "height": 260,
              "skin": "downloads/2d/card_option/CardFrame_01_White_Bg.png",
              "sizeGrid": "24,24,24,24,0",
              "label": "箭塔",
              "labelSize": 36,
              "labelAlign": "center",
              "labelVAlign": "middle"
            },
            {
              "_$id": "p5zyi812",
              "_$type": "Button",
              "name": "CardButtonB",
              "x": 340,
              "y": 100,
              "width": 280,
              "height": 260,
              "skin": "downloads/2d/card_option/CardFrame_01_White_Bg.png",
              "sizeGrid": "24,24,24,24,0",
              "label": "兵营",
              "labelSize": 36,
              "labelAlign": "center",
              "labelVAlign": "middle"
            },
            {
              "_$id": "ub7ia4l5",
              "_$type": "Button",
              "name": "CardButtonC",
              "x": 650,
              "y": 100,
              "width": 280,
              "height": 260,
              "skin": "downloads/2d/card_option/CardFrame_01_White_Bg.png",
              "sizeGrid": "24,24,24,24,0",
              "label": "龙巢",
              "labelSize": 36,
              "labelAlign": "center",
              "labelVAlign": "middle"
            }
          ]
        },
        {
          "_$id": "syrvl1kr",
          "_$type": "Box",
          "name": "ResultPanel",
          "x": 80,
          "y": 600,
          "width": 920,
          "height": 560,
          "visible": false,
          "_$child": [
            {
              "_$id": "resultpanelsample",
              "_$type": "Image",
              "name": "ResultPanelAssetSample",
              "width": 920,
              "height": 560,
              "skin": "downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png",
              "sizeGrid": "24,24,24,24,0",
              "color": "#ffffff"
            },
            {
              "_$id": "oylx98l7",
              "_$type": "Label",
              "name": "ResultTitle",
              "y": 80,
              "width": 920,
              "height": 110,
              "text": "领地守住了！",
              "fontSize": 72,
              "color": "#FFFFFF",
              "align": "center",
              "stroke": 8,
              "strokeColor": "#1B2E3F"
            },
            {
              "_$id": "bf3mjwpf",
              "_$type": "Label",
              "name": "ResultText",
              "x": 40,
              "y": 210,
              "width": 840,
              "height": 80,
              "text": "完整版解锁更多卡组与关卡",
              "fontSize": 40,
              "color": "#FFFFFF",
              "align": "center",
              "stroke": 5,
              "strokeColor": "#1B2E3F"
            },
            {
              "_$id": "ng9ochb5",
              "_$type": "Button",
              "name": "ResultCTAButton",
              "x": 260,
              "y": 360,
              "width": 400,
              "height": 110,
              "label": "立即下载",
              "labelSize": 44,
              "labelAlign": "center",
              "labelVAlign": "middle"
            }
          ]
        },
        {
          "_$id": "5bko6yzn",
          "_$type": "Button",
          "name": "CTAButton",
          "x": 340,
          "y": 1740,
          "width": 400,
          "height": 110,
          "label": "立即下载",
          "labelSize": 40,
          "labelAlign": "center",
          "labelVAlign": "middle"
        },
        {
          "_$id": "20cu43he",
          "_$type": "Box",
          "name": "UnlockCostLayer",
          "width": 1080,
          "height": 1920
        },
        {
          "_$id": "tutorialassetsample",
          "_$type": "Image",
          "name": "TutorialHintAssetSample",
          "x": 150,
          "y": 252,
          "width": 64,
          "height": 64,
          "skin": "downloads/2d/tutorial_hint/info.png",
          "color": "#ffffff"
        }
      ]
    }
  ]
}
