import type { SkillClass, SkillDef } from '@/types/game'

export const SKILL_CLASSES: { id: SkillClass; name: string; description: string }[] = [
  { id: 'warrior', name: '戰士', description: '高攻擊與前線壓制' },
  { id: 'tank', name: '坦克', description: '高防與厚血' },
  { id: 'assassin', name: '刺客', description: '暴擊與爆發' },
  { id: 'mage', name: '法師', description: '元素火力' },
  { id: 'merchant', name: '商人', description: '金幣與掉落' },
  { id: 'explorer', name: '探險家', description: '探索與經驗' },
]

export const SKILLS: SkillDef[] = [
  {
    "id": "warrior-1",
    "classId": "warrior",
    "name": "猛擊",
    "description": "戰士系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "effect": {
      "attack": 2.3,
      "maxHp": 2
    }
  },
  {
    "id": "warrior-2",
    "classId": "warrior",
    "name": "破甲",
    "description": "戰士系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "warrior-1"
    ],
    "effect": {
      "attack": 2.3,
      "maxHp": 2
    }
  },
  {
    "id": "warrior-3",
    "classId": "warrior",
    "name": "戰嚎",
    "description": "戰士系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "warrior-2"
    ],
    "effect": {
      "attack": 2.3,
      "maxHp": 2
    }
  },
  {
    "id": "warrior-4",
    "classId": "warrior",
    "name": "執劍",
    "description": "戰士系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "warrior-3"
    ],
    "effect": {
      "attack": 3.1,
      "maxHp": 4
    }
  },
  {
    "id": "warrior-5",
    "classId": "warrior",
    "name": "不滅",
    "description": "戰士系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "warrior-4"
    ],
    "effect": {
      "attack": 3.1,
      "maxHp": 4
    }
  },
  {
    "id": "warrior-6",
    "classId": "warrior",
    "name": "突擊",
    "description": "戰士系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "warrior-5"
    ],
    "effect": {
      "attack": 3.1,
      "maxHp": 4
    }
  },
  {
    "id": "warrior-7",
    "classId": "warrior",
    "name": "鋼刃",
    "description": "戰士系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "warrior-6"
    ],
    "effect": {
      "attack": 3.9000000000000004,
      "maxHp": 6
    }
  },
  {
    "id": "warrior-8",
    "classId": "warrior",
    "name": "血戰",
    "description": "戰士系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "warrior-7"
    ],
    "effect": {
      "attack": 3.9000000000000004,
      "maxHp": 6
    }
  },
  {
    "id": "warrior-9",
    "classId": "warrior",
    "name": "開路",
    "description": "戰士系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "warrior-8"
    ],
    "effect": {
      "attack": 3.9000000000000004,
      "maxHp": 6
    }
  },
  {
    "id": "warrior-10",
    "classId": "warrior",
    "name": "裂地",
    "description": "戰士系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "warrior-9"
    ],
    "effect": {
      "attack": 4.7,
      "maxHp": 8
    }
  },
  {
    "id": "warrior-11",
    "classId": "warrior",
    "name": "先鋒",
    "description": "戰士系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "warrior-10"
    ],
    "effect": {
      "attack": 4.7,
      "maxHp": 8
    }
  },
  {
    "id": "warrior-12",
    "classId": "warrior",
    "name": "斬陣",
    "description": "戰士系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "warrior-11"
    ],
    "effect": {
      "attack": 4.7,
      "maxHp": 8
    }
  },
  {
    "id": "warrior-13",
    "classId": "warrior",
    "name": "鐵腕",
    "description": "戰士系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "warrior-12"
    ],
    "effect": {
      "attack": 5.5,
      "maxHp": 10
    }
  },
  {
    "id": "warrior-14",
    "classId": "warrior",
    "name": "總攻",
    "description": "戰士系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "warrior-13"
    ],
    "effect": {
      "attack": 5.5,
      "maxHp": 10
    }
  },
  {
    "id": "warrior-15",
    "classId": "warrior",
    "name": "狂戰士",
    "description": "戰士系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "warrior-14"
    ],
    "effect": {
      "attack": 5.5,
      "maxHp": 10
    }
  },
  {
    "id": "warrior-16",
    "classId": "warrior",
    "name": "盾破",
    "description": "戰士系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "warrior-15"
    ],
    "effect": {
      "attack": 6.300000000000001,
      "maxHp": 12
    }
  },
  {
    "id": "warrior-17",
    "classId": "warrior",
    "name": "王者之刃",
    "description": "戰士系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "warrior-16"
    ],
    "effect": {
      "attack": 6.300000000000001,
      "maxHp": 12
    }
  },
  {
    "id": "warrior-18",
    "classId": "warrior",
    "name": "裁決",
    "description": "戰士系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "warrior-17"
    ],
    "effect": {
      "attack": 6.300000000000001,
      "maxHp": 12
    }
  },
  {
    "id": "tank-1",
    "classId": "tank",
    "name": "堅壁",
    "description": "坦克系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "effect": {
      "defense": 1.9,
      "maxHp": 10
    }
  },
  {
    "id": "tank-2",
    "classId": "tank",
    "name": "嘲諷",
    "description": "坦克系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "tank-1"
    ],
    "effect": {
      "defense": 1.9,
      "maxHp": 10
    }
  },
  {
    "id": "tank-3",
    "classId": "tank",
    "name": "厚甲",
    "description": "坦克系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "tank-2"
    ],
    "effect": {
      "defense": 1.9,
      "maxHp": 10
    }
  },
  {
    "id": "tank-4",
    "classId": "tank",
    "name": "屹立",
    "description": "坦克系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "tank-3"
    ],
    "effect": {
      "defense": 2.5999999999999996,
      "maxHp": 14
    }
  },
  {
    "id": "tank-5",
    "classId": "tank",
    "name": "護衞",
    "description": "坦克系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "tank-4"
    ],
    "effect": {
      "defense": 2.5999999999999996,
      "maxHp": 14
    }
  },
  {
    "id": "tank-6",
    "classId": "tank",
    "name": "耐性",
    "description": "坦克系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "tank-5"
    ],
    "effect": {
      "defense": 2.5999999999999996,
      "maxHp": 14
    }
  },
  {
    "id": "tank-7",
    "classId": "tank",
    "name": "堡壘",
    "description": "坦克系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "tank-6"
    ],
    "effect": {
      "defense": 3.3,
      "maxHp": 18
    }
  },
  {
    "id": "tank-8",
    "classId": "tank",
    "name": "回春",
    "description": "坦克系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "tank-7"
    ],
    "effect": {
      "defense": 3.3,
      "maxHp": 18
    }
  },
  {
    "id": "tank-9",
    "classId": "tank",
    "name": "磐石",
    "description": "坦克系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "tank-8"
    ],
    "effect": {
      "defense": 3.3,
      "maxHp": 18
    }
  },
  {
    "id": "tank-10",
    "classId": "tank",
    "name": "反震",
    "description": "坦克系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "tank-9"
    ],
    "effect": {
      "defense": 4,
      "maxHp": 22
    }
  },
  {
    "id": "tank-11",
    "classId": "tank",
    "name": "守護",
    "description": "坦克系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "tank-10"
    ],
    "effect": {
      "defense": 4,
      "maxHp": 22
    }
  },
  {
    "id": "tank-12",
    "classId": "tank",
    "name": "鋼膚",
    "description": "坦克系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "tank-11"
    ],
    "effect": {
      "defense": 4,
      "maxHp": 22
    }
  },
  {
    "id": "tank-13",
    "classId": "tank",
    "name": "無懼",
    "description": "坦克系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "tank-12"
    ],
    "effect": {
      "defense": 4.7,
      "maxHp": 26
    }
  },
  {
    "id": "tank-14",
    "classId": "tank",
    "name": "重生壁",
    "description": "坦克系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "tank-13"
    ],
    "effect": {
      "defense": 4.7,
      "maxHp": 26
    }
  },
  {
    "id": "tank-15",
    "classId": "tank",
    "name": "城牆",
    "description": "坦克系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "tank-14"
    ],
    "effect": {
      "defense": 4.7,
      "maxHp": 26
    }
  },
  {
    "id": "tank-16",
    "classId": "tank",
    "name": "韌性",
    "description": "坦克系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "tank-15"
    ],
    "effect": {
      "defense": 5.3999999999999995,
      "maxHp": 30
    }
  },
  {
    "id": "tank-17",
    "classId": "tank",
    "name": "聖盾",
    "description": "坦克系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "tank-16"
    ],
    "effect": {
      "defense": 5.3999999999999995,
      "maxHp": 30
    }
  },
  {
    "id": "tank-18",
    "classId": "tank",
    "name": "不滅之牆",
    "description": "坦克系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "tank-17"
    ],
    "effect": {
      "defense": 5.3999999999999995,
      "maxHp": 30
    }
  },
  {
    "id": "assassin-1",
    "classId": "assassin",
    "name": "暗襲",
    "description": "刺客系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "effect": {
      "critChance": 0.008,
      "critDamage": 0.05,
      "attack": 1.2000000000000002
    }
  },
  {
    "id": "assassin-2",
    "classId": "assassin",
    "name": "毒刃",
    "description": "刺客系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "assassin-1"
    ],
    "effect": {
      "critChance": 0.008,
      "critDamage": 0.05,
      "attack": 1.2000000000000002
    }
  },
  {
    "id": "assassin-3",
    "classId": "assassin",
    "name": "影步",
    "description": "刺客系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "assassin-2"
    ],
    "effect": {
      "critChance": 0.008,
      "critDamage": 0.05,
      "attack": 1.2000000000000002
    }
  },
  {
    "id": "assassin-4",
    "classId": "assassin",
    "name": "致命",
    "description": "刺客系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "assassin-3"
    ],
    "effect": {
      "critChance": 0.011,
      "critDamage": 0.07,
      "attack": 1.6
    }
  },
  {
    "id": "assassin-5",
    "classId": "assassin",
    "name": "背刺",
    "description": "刺客系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "assassin-4"
    ],
    "effect": {
      "critChance": 0.011,
      "critDamage": 0.07,
      "attack": 1.6
    }
  },
  {
    "id": "assassin-6",
    "classId": "assassin",
    "name": "血印",
    "description": "刺客系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "assassin-5"
    ],
    "effect": {
      "critChance": 0.011,
      "critDamage": 0.07,
      "attack": 1.6
    }
  },
  {
    "id": "assassin-7",
    "classId": "assassin",
    "name": "疾影",
    "description": "刺客系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "assassin-6"
    ],
    "effect": {
      "critChance": 0.014000000000000002,
      "critDamage": 0.09,
      "attack": 2
    }
  },
  {
    "id": "assassin-8",
    "classId": "assassin",
    "name": "割喉",
    "description": "刺客系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "assassin-7"
    ],
    "effect": {
      "critChance": 0.014000000000000002,
      "critDamage": 0.09,
      "attack": 2
    }
  },
  {
    "id": "assassin-9",
    "classId": "assassin",
    "name": "潛伏",
    "description": "刺客系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "assassin-8"
    ],
    "effect": {
      "critChance": 0.014000000000000002,
      "critDamage": 0.09,
      "attack": 2
    }
  },
  {
    "id": "assassin-10",
    "classId": "assassin",
    "name": "暗殺",
    "description": "刺客系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "assassin-9"
    ],
    "effect": {
      "critChance": 0.017,
      "critDamage": 0.11,
      "attack": 2.4000000000000004
    }
  },
  {
    "id": "assassin-11",
    "classId": "assassin",
    "name": "毒霧",
    "description": "刺客系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "assassin-10"
    ],
    "effect": {
      "critChance": 0.017,
      "critDamage": 0.11,
      "attack": 2.4000000000000004
    }
  },
  {
    "id": "assassin-12",
    "classId": "assassin",
    "name": "連斬",
    "description": "刺客系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "assassin-11"
    ],
    "effect": {
      "critChance": 0.017,
      "critDamage": 0.11,
      "attack": 2.4000000000000004
    }
  },
  {
    "id": "assassin-13",
    "classId": "assassin",
    "name": "無聲",
    "description": "刺客系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "assassin-12"
    ],
    "effect": {
      "critChance": 0.02,
      "critDamage": 0.13,
      "attack": 2.8
    }
  },
  {
    "id": "assassin-14",
    "classId": "assassin",
    "name": "血月",
    "description": "刺客系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "assassin-13"
    ],
    "effect": {
      "critChance": 0.02,
      "critDamage": 0.13,
      "attack": 2.8
    }
  },
  {
    "id": "assassin-15",
    "classId": "assassin",
    "name": "絕命",
    "description": "刺客系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "assassin-14"
    ],
    "effect": {
      "critChance": 0.02,
      "critDamage": 0.13,
      "attack": 2.8
    }
  },
  {
    "id": "assassin-16",
    "classId": "assassin",
    "name": "影刃",
    "description": "刺客系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "assassin-15"
    ],
    "effect": {
      "critChance": 0.023000000000000003,
      "critDamage": 0.15,
      "attack": 3.2
    }
  },
  {
    "id": "assassin-17",
    "classId": "assassin",
    "name": "千手",
    "description": "刺客系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "assassin-16"
    ],
    "effect": {
      "critChance": 0.023000000000000003,
      "critDamage": 0.15,
      "attack": 3.2
    }
  },
  {
    "id": "assassin-18",
    "classId": "assassin",
    "name": "終結",
    "description": "刺客系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "assassin-17"
    ],
    "effect": {
      "critChance": 0.023000000000000003,
      "critDamage": 0.15,
      "attack": 3.2
    }
  },
  {
    "id": "mage-1",
    "classId": "mage",
    "name": "火球",
    "description": "法師系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "effect": {
      "attack": 3,
      "critDamage": 0.035,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-2",
    "classId": "mage",
    "name": "冰封",
    "description": "法師系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "mage-1"
    ],
    "effect": {
      "attack": 3,
      "critDamage": 0.035,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-3",
    "classId": "mage",
    "name": "雷鏈",
    "description": "法師系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "mage-2"
    ],
    "effect": {
      "attack": 3,
      "critDamage": 0.035,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-4",
    "classId": "mage",
    "name": "奥術",
    "description": "法師系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "mage-3"
    ],
    "effect": {
      "attack": 4,
      "critDamage": 0.05,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-5",
    "classId": "mage",
    "name": "元素",
    "description": "法師系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "mage-4"
    ],
    "effect": {
      "attack": 4,
      "critDamage": 0.05,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-6",
    "classId": "mage",
    "name": "魔爆",
    "description": "法師系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "mage-5"
    ],
    "effect": {
      "attack": 4,
      "critDamage": 0.05,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-7",
    "classId": "mage",
    "name": "法陣",
    "description": "法師系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "mage-6"
    ],
    "effect": {
      "attack": 5,
      "critDamage": 0.065,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-8",
    "classId": "mage",
    "name": "咒文",
    "description": "法師系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "mage-7"
    ],
    "effect": {
      "attack": 5,
      "critDamage": 0.065,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-9",
    "classId": "mage",
    "name": "炎柱",
    "description": "法師系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "mage-8"
    ],
    "effect": {
      "attack": 5,
      "critDamage": 0.065,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-10",
    "classId": "mage",
    "name": "霜環",
    "description": "法師系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "mage-9"
    ],
    "effect": {
      "attack": 6,
      "critDamage": 0.08,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-11",
    "classId": "mage",
    "name": "電刑",
    "description": "法師系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "mage-10"
    ],
    "effect": {
      "attack": 6,
      "critDamage": 0.08,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-12",
    "classId": "mage",
    "name": "魔力",
    "description": "法師系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "mage-11"
    ],
    "effect": {
      "attack": 6,
      "critDamage": 0.08,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-13",
    "classId": "mage",
    "name": "虛空",
    "description": "法師系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "mage-12"
    ],
    "effect": {
      "attack": 7,
      "critDamage": 0.095,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-14",
    "classId": "mage",
    "name": "星火",
    "description": "法師系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "mage-13"
    ],
    "effect": {
      "attack": 7,
      "critDamage": 0.095,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-15",
    "classId": "mage",
    "name": "災厄",
    "description": "法師系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "mage-14"
    ],
    "effect": {
      "attack": 7,
      "critDamage": 0.095,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-16",
    "classId": "mage",
    "name": "研習",
    "description": "法師系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "mage-15"
    ],
    "effect": {
      "attack": 8,
      "critDamage": 0.11,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-17",
    "classId": "mage",
    "name": "秘儀",
    "description": "法師系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "mage-16"
    ],
    "effect": {
      "attack": 8,
      "critDamage": 0.11,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "mage-18",
    "classId": "mage",
    "name": "終焉咒",
    "description": "法師系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "mage-17"
    ],
    "effect": {
      "attack": 8,
      "critDamage": 0.11,
      "attackSpeed": 0.01
    }
  },
  {
    "id": "merchant-1",
    "classId": "merchant",
    "name": "議價",
    "description": "商人系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "effect": {
      "goldMultiplier": 0.06,
      "dropMultiplier": 0.015
    }
  },
  {
    "id": "merchant-2",
    "classId": "merchant",
    "name": "囤貨",
    "description": "商人系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "merchant-1"
    ],
    "effect": {
      "goldMultiplier": 0.06,
      "dropMultiplier": 0.015
    }
  },
  {
    "id": "merchant-3",
    "classId": "merchant",
    "name": "分紅",
    "description": "商人系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "merchant-2"
    ],
    "effect": {
      "goldMultiplier": 0.06,
      "dropMultiplier": 0.015
    }
  },
  {
    "id": "merchant-4",
    "classId": "merchant",
    "name": "金庫",
    "description": "商人系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "merchant-3"
    ],
    "effect": {
      "goldMultiplier": 0.08,
      "dropMultiplier": 0.02
    }
  },
  {
    "id": "merchant-5",
    "classId": "merchant",
    "name": "人脈",
    "description": "商人系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "merchant-4"
    ],
    "effect": {
      "goldMultiplier": 0.08,
      "dropMultiplier": 0.02
    }
  },
  {
    "id": "merchant-6",
    "classId": "merchant",
    "name": "投資",
    "description": "商人系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "merchant-5"
    ],
    "effect": {
      "goldMultiplier": 0.08,
      "dropMultiplier": 0.02
    }
  },
  {
    "id": "merchant-7",
    "classId": "merchant",
    "name": "走私",
    "description": "商人系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "merchant-6"
    ],
    "effect": {
      "goldMultiplier": 0.1,
      "dropMultiplier": 0.025
    }
  },
  {
    "id": "merchant-8",
    "classId": "merchant",
    "name": "帳冊",
    "description": "商人系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "merchant-7"
    ],
    "effect": {
      "goldMultiplier": 0.1,
      "dropMultiplier": 0.025
    }
  },
  {
    "id": "merchant-9",
    "classId": "merchant",
    "name": "稅收",
    "description": "商人系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "merchant-8"
    ],
    "effect": {
      "goldMultiplier": 0.1,
      "dropMultiplier": 0.025
    }
  },
  {
    "id": "merchant-10",
    "classId": "merchant",
    "name": "折扣",
    "description": "商人系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "merchant-9"
    ],
    "effect": {
      "goldMultiplier": 0.12,
      "dropMultiplier": 0.03
    }
  },
  {
    "id": "merchant-11",
    "classId": "merchant",
    "name": "包租",
    "description": "商人系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "merchant-10"
    ],
    "effect": {
      "goldMultiplier": 0.12,
      "dropMultiplier": 0.03
    }
  },
  {
    "id": "merchant-12",
    "classId": "merchant",
    "name": "標售",
    "description": "商人系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "merchant-11"
    ],
    "effect": {
      "goldMultiplier": 0.12,
      "dropMultiplier": 0.03
    }
  },
  {
    "id": "merchant-13",
    "classId": "merchant",
    "name": "複利",
    "description": "商人系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "merchant-12"
    ],
    "effect": {
      "goldMultiplier": 0.14,
      "dropMultiplier": 0.035
    }
  },
  {
    "id": "merchant-14",
    "classId": "merchant",
    "name": "商會",
    "description": "商人系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "merchant-13"
    ],
    "effect": {
      "goldMultiplier": 0.14,
      "dropMultiplier": 0.035
    }
  },
  {
    "id": "merchant-15",
    "classId": "merchant",
    "name": "金脈",
    "description": "商人系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "merchant-14"
    ],
    "effect": {
      "goldMultiplier": 0.14,
      "dropMultiplier": 0.035
    }
  },
  {
    "id": "merchant-16",
    "classId": "merchant",
    "name": "奇貨",
    "description": "商人系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "merchant-15"
    ],
    "effect": {
      "goldMultiplier": 0.16,
      "dropMultiplier": 0.04
    }
  },
  {
    "id": "merchant-17",
    "classId": "merchant",
    "name": "壟斷",
    "description": "商人系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "merchant-16"
    ],
    "effect": {
      "goldMultiplier": 0.16,
      "dropMultiplier": 0.04
    }
  },
  {
    "id": "merchant-18",
    "classId": "merchant",
    "name": "財神",
    "description": "商人系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "merchant-17"
    ],
    "effect": {
      "goldMultiplier": 0.16,
      "dropMultiplier": 0.04
    }
  },
  {
    "id": "explorer-1",
    "classId": "explorer",
    "name": "探路",
    "description": "探險家系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "effect": {
      "dropMultiplier": 0.06,
      "expMultiplier": 0.045,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-2",
    "classId": "explorer",
    "name": "搜刮",
    "description": "探險家系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "explorer-1"
    ],
    "effect": {
      "dropMultiplier": 0.06,
      "expMultiplier": 0.045,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-3",
    "classId": "explorer",
    "name": "識圖",
    "description": "探險家系技能：強化成長路線（階 1）",
    "tier": 1,
    "cost": 1,
    "requires": [
      "explorer-2"
    ],
    "effect": {
      "dropMultiplier": 0.06,
      "expMultiplier": 0.045,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-4",
    "classId": "explorer",
    "name": "遺跡",
    "description": "探險家系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "explorer-3"
    ],
    "effect": {
      "dropMultiplier": 0.08,
      "expMultiplier": 0.06,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-5",
    "classId": "explorer",
    "name": "驚喜",
    "description": "探險家系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "explorer-4"
    ],
    "effect": {
      "dropMultiplier": 0.08,
      "expMultiplier": 0.06,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-6",
    "classId": "explorer",
    "name": "旅途",
    "description": "探險家系技能：強化成長路線（階 2）",
    "tier": 2,
    "cost": 2,
    "requires": [
      "explorer-5"
    ],
    "effect": {
      "dropMultiplier": 0.08,
      "expMultiplier": 0.06,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-7",
    "classId": "explorer",
    "name": "開圖",
    "description": "探險家系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "explorer-6"
    ],
    "effect": {
      "dropMultiplier": 0.1,
      "expMultiplier": 0.075,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-8",
    "classId": "explorer",
    "name": "倖存",
    "description": "探險家系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "explorer-7"
    ],
    "effect": {
      "dropMultiplier": 0.1,
      "expMultiplier": 0.075,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-9",
    "classId": "explorer",
    "name": "旅程",
    "description": "探險家系技能：強化成長路線（階 3）",
    "tier": 3,
    "cost": 3,
    "requires": [
      "explorer-8"
    ],
    "effect": {
      "dropMultiplier": 0.1,
      "expMultiplier": 0.075,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-10",
    "classId": "explorer",
    "name": "寶藏",
    "description": "探險家系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "explorer-9"
    ],
    "effect": {
      "dropMultiplier": 0.12,
      "expMultiplier": 0.09,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-11",
    "classId": "explorer",
    "name": "足跡",
    "description": "探險家系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "explorer-10"
    ],
    "effect": {
      "dropMultiplier": 0.12,
      "expMultiplier": 0.09,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-12",
    "classId": "explorer",
    "name": "導航",
    "description": "探險家系技能：強化成長路線（階 4）",
    "tier": 4,
    "cost": 4,
    "requires": [
      "explorer-11"
    ],
    "effect": {
      "dropMultiplier": 0.12,
      "expMultiplier": 0.09,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-13",
    "classId": "explorer",
    "name": "奇遇",
    "description": "探險家系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "explorer-12"
    ],
    "effect": {
      "dropMultiplier": 0.14,
      "expMultiplier": 0.105,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-14",
    "classId": "explorer",
    "name": "采礦",
    "description": "探險家系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "explorer-13"
    ],
    "effect": {
      "dropMultiplier": 0.14,
      "expMultiplier": 0.105,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-15",
    "classId": "explorer",
    "name": "荒野",
    "description": "探險家系技能：強化成長路線（階 5）",
    "tier": 5,
    "cost": 5,
    "requires": [
      "explorer-14"
    ],
    "effect": {
      "dropMultiplier": 0.14,
      "expMultiplier": 0.105,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-16",
    "classId": "explorer",
    "name": "地圖學",
    "description": "探險家系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "explorer-15"
    ],
    "effect": {
      "dropMultiplier": 0.16,
      "expMultiplier": 0.12,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-17",
    "classId": "explorer",
    "name": "探險王",
    "description": "探險家系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "explorer-16"
    ],
    "effect": {
      "dropMultiplier": 0.16,
      "expMultiplier": 0.12,
      "attackSpeed": 0.008
    }
  },
  {
    "id": "explorer-18",
    "classId": "explorer",
    "name": "遠征",
    "description": "探險家系技能：強化成長路線（階 6）",
    "tier": 6,
    "cost": 6,
    "requires": [
      "explorer-17"
    ],
    "effect": {
      "dropMultiplier": 0.16,
      "expMultiplier": 0.12,
      "attackSpeed": 0.008
    }
  }
]

export function skillsForClass(classId: SkillClass) {
  return SKILLS.filter((skill) => skill.classId === classId)
}
