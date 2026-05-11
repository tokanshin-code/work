{
  "_$ver": 1,
  "_$id": "vkrlk1jf",
  "_$type": "Scene",
  "name": "Scene2D",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "_$child": [
    {
      "_$id": "n9gjxcltvl",
      "_$type": "Scene3D",
      "name": "Scene3D",
      "ambientMode": 0,
      "ambientColor": {
        "_$type": "Color",
        "r": 0.424308,
        "g": 0.4578516,
        "b": 0.5294118
      },
      "skyRenderer": {
        "meshType": "dome",
        "material": {
          "_$uuid": "793cffc6-730a-4756-a658-efe98c230292",
          "_$type": "Material"
        }
      },
      "fogStart": 0,
      "fogColor": {
        "_$type": "Color",
        "r": 0.5,
        "g": 0.5,
        "b": 0.5
      },
      "lightmaps": [],
      "_$child": [
        {
          "_$id": "6jx8h8bvc6",
          "_$type": "Camera",
          "name": "Main Camera",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "y": 1,
              "z": 5
            }
          },
          "clearFlag": 1,
          "clearColor": {
            "_$type": "Color",
            "r": 0.3921,
            "g": 0.5843,
            "b": 0.9294
          },
          "orthographicVerticalSize": 10,
          "fieldOfView": 60,
          "nearPlane": 0.3,
          "farPlane": 1000,
          "normalizedViewport": {
            "_$type": "Viewport",
            "width": 1,
            "height": 1
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
            "localRotationEuler": {
              "_$type": "Vector3",
              "x": -50,
              "y": 30
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
              },
              "lightmapBakedType": 1,
              "shadowMode": 0,
              "shadowStrength": 1,
              "shadowDistance": 50,
              "shadowDepthBias": 1,
              "shadowNormalBias": 1,
              "shadowNearPlane": 0.1,
              "shadowCascadesMode": 0
            }
          ]
        },
        {
          "_$id": "l77bzsm6",
          "name": "HexBoard",
          "_$type": "Sprite3D",
          "_$comp": [
            {
              "_$type": "3c9e2068-0eee-4432-91fa-668b8e3659ea",
              "_$id": "g2rqe61n",
              "hexBoard": {
                "_$ref": "l77bzsm6"
              },
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
              "soldierPrefabPath": "downloads/3d/soldier/Role_taikong_01.lh",
              "dragonPrefabPath": "downloads/3d/dragon/Role_xiaohuangya_01.lh",
              "towerPrefabPath": "downloads/3d/tower/SM_Prop_GuardTower_01.lh",
              "barracksPrefabPath": "downloads/3d/barracks/SM_Bld_Military_Tent_03.lh",
              "fireEffectPath": "downloads/3d/effects/FLame_red.lh",
              "hitSoundPath": "downloads/2d/sfx/afedc1f409ba5418cc3ff2d6fdc64eca.mp3",
              "bgmPath": "downloads/2d/bgm/f93f9377dcad12be63b55fcad314858d.mp3",
              "initialMoney": 20,
              "hexCost": 25,
              "timerCount": 80,
              "incomeInterval": 3,
              "spawnRate": 3,
              "redirectTouchCount": 5
            }
          ]
        },
        {
          "_$id": "hmtxejx8",
          "name": "Bases",
          "_$type": "Sprite3D",
          "_$child": [
            {
              "_$id": "gtm62qlf",
              "name": "PlayerBase",
              "_$prefab": "c4194c66-3069-4272-8097-89a1c58ebd67",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 0,
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
              "name": "EnemyBase",
              "_$prefab": "c4194c66-3069-4272-8097-89a1c58ebd67",
              "transform": {
                "localPosition": {
                  "_$type": "Vector3",
                  "x": 0,
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
          "name": "Buildings",
          "_$type": "Sprite3D"
        },
        {
          "_$id": "kaq3k0ta",
          "name": "Units",
          "_$type": "Sprite3D"
        }
      ]
    },
    {
      "_$id": "gl0efi1v",
      "name": "GameUIRoot",
      "_$type": "Box",
      "width": 1080,
      "height": 1920,
      "_$child": [
        {
          "_$id": "svtcmace",
          "name": "TimerLabel",
          "_$type": "Label",
          "text": "80",
          "fontSize": 54,
          "color": "#FFFFFF",
          "stroke": 5,
          "strokeColor": "#243447",
          "x": 48,
          "y": 36,
          "width": 220,
          "height": 80
        },
        {
          "_$id": "tn6of286",
          "name": "MoneyLabel",
          "_$type": "Label",
          "text": "20",
          "fontSize": 48,
          "color": "#FFE46B",
          "stroke": 5,
          "strokeColor": "#3A2500",
          "x": 820,
          "y": 42,
          "width": 220,
          "height": 72,
          "align": "right"
        },
        {
          "_$id": "3aetoxti",
          "name": "HintLabel",
          "_$type": "Label",
          "text": "点击相邻地块扩张领地",
          "fontSize": 48,
          "color": "#FFFFFF",
          "stroke": 6,
          "strokeColor": "#13231A",
          "x": 120,
          "y": 240,
          "width": 840,
          "height": 90,
          "align": "center"
        },
        {
          "_$id": "byt21aqx",
          "name": "CardChoicePanel",
          "_$type": "Box",
          "x": 60,
          "y": 1080,
          "width": 960,
          "height": 420,
          "visible": false,
          "_$child": [
            {
              "_$id": "3dica8rl",
              "name": "CardTitle",
              "_$type": "Label",
              "text": "选择一张卡牌强化防线",
              "fontSize": 44,
              "color": "#FFFFFF",
              "stroke": 5,
              "strokeColor": "#1D2733",
              "x": 0,
              "y": 0,
              "width": 960,
              "height": 80,
              "align": "center"
            },
            {
              "_$id": "9agl3ots",
              "name": "CardButtonA",
              "_$type": "Button",
              "label": "箭塔",
              "labelSize": 36,
              "x": 30,
              "y": 100,
              "width": 280,
              "height": 260
            },
            {
              "_$id": "p5zyi812",
              "name": "CardButtonB",
              "_$type": "Button",
              "label": "兵营",
              "labelSize": 36,
              "x": 340,
              "y": 100,
              "width": 280,
              "height": 260
            },
            {
              "_$id": "ub7ia4l5",
              "name": "CardButtonC",
              "_$type": "Button",
              "label": "龙巢",
              "labelSize": 36,
              "x": 650,
              "y": 100,
              "width": 280,
              "height": 260
            }
          ]
        },
        {
          "_$id": "syrvl1kr",
          "name": "ResultPanel",
          "_$type": "Box",
          "x": 80,
          "y": 600,
          "width": 920,
          "height": 560,
          "visible": false,
          "_$child": [
            {
              "_$id": "oylx98l7",
              "name": "ResultTitle",
              "_$type": "Label",
              "text": "领地守住了！",
              "fontSize": 72,
              "color": "#FFFFFF",
              "stroke": 8,
              "strokeColor": "#1B2E3F",
              "x": 0,
              "y": 80,
              "width": 920,
              "height": 110,
              "align": "center"
            },
            {
              "_$id": "bf3mjwpf",
              "name": "ResultText",
              "_$type": "Label",
              "text": "完整版解锁更多卡组与关卡",
              "fontSize": 40,
              "color": "#FFFFFF",
              "stroke": 5,
              "strokeColor": "#1B2E3F",
              "x": 40,
              "y": 210,
              "width": 840,
              "height": 80,
              "align": "center"
            },
            {
              "_$id": "ng9ochb5",
              "name": "ResultCTAButton",
              "_$type": "Button",
              "label": "立即下载",
              "labelSize": 44,
              "x": 260,
              "y": 360,
              "width": 400,
              "height": 110
            }
          ]
        },
        {
          "_$id": "5bko6yzn",
          "name": "CTAButton",
          "_$type": "Button",
          "label": "立即下载",
          "labelSize": 40,
          "x": 340,
          "y": 1740,
          "width": 400,
          "height": 110
        }
      ]
    }
  ]
}