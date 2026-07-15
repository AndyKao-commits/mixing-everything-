import type { Vec, ZoneDef, ZoneId } from './types'

// 0 grass, 1 tree/rock, 2 path, 3 mist, 4 camp, 5 portal
const MISTWOOD: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 2, 2, 2, 0, 0, 3, 3, 0, 0, 0, 4, 1],
  [1, 0, 1, 2, 0, 2, 0, 1, 3, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 2, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 1],
  [1, 3, 3, 2, 0, 0, 0, 1, 0, 2, 2, 2, 1, 0, 1],
  [1, 3, 0, 2, 2, 2, 0, 0, 0, 2, 0, 0, 0, 5, 1],
  [1, 0, 0, 0, 0, 2, 1, 1, 0, 2, 0, 3, 3, 0, 1],
  [1, 0, 1, 0, 0, 2, 2, 2, 2, 2, 0, 3, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 1],
  [1, 4, 0, 0, 0, 0, 3, 3, 0, 0, 0, 2, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

const RUINS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 4, 0, 0, 1, 2, 2, 2, 2, 2, 1, 0, 0, 5, 1],
  [1, 0, 1, 0, 1, 2, 0, 3, 0, 2, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 0, 1],
  [1, 3, 3, 1, 0, 2, 2, 2, 2, 2, 0, 1, 3, 3, 1],
  [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 1],
  [1, 0, 0, 0, 2, 0, 3, 0, 3, 0, 2, 0, 0, 0, 1],
  [1, 1, 0, 0, 2, 0, 0, 4, 0, 0, 2, 0, 0, 1, 1],
  [1, 5, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

const MARSH: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 5, 0, 3, 3, 0, 2, 2, 2, 0, 3, 3, 0, 4, 1],
  [1, 0, 0, 3, 1, 0, 2, 0, 2, 0, 1, 3, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 0, 1],
  [1, 3, 3, 0, 2, 2, 2, 0, 2, 2, 2, 0, 3, 3, 1],
  [1, 0, 0, 0, 2, 0, 0, 4, 0, 0, 2, 0, 0, 0, 1],
  [1, 0, 1, 0, 2, 0, 3, 3, 3, 0, 2, 0, 1, 0, 1],
  [1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1],
  [1, 3, 3, 0, 0, 0, 1, 2, 1, 0, 0, 0, 3, 3, 1],
  [1, 4, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 5, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

export const ZONES: Record<ZoneId, ZoneDef> = {
  mistwood: {
    id: 'mistwood',
    name: 'Mistwood',
    nameZh: '霧林外緣',
    hint: '新手區。踩紫霧遇敵，亮門可通往廢墟。',
    map: MISTWOOD,
    spawn: { x: 3, y: 5 },
    portalTo: 'ruins',
    portalSpawn: { x: 2, y: 9 },
    mistBoost: 0,
  },
  ruins: {
    id: 'ruins',
    name: 'Broken Ruins',
    nameZh: '碎石廢墟',
    hint: '怪比較凶。兩邊亮門分別通往霧林／沼澤。',
    map: RUINS,
    spawn: { x: 7, y: 5 },
    portalTo: 'marsh',
    portalSpawn: { x: 1, y: 1 },
    mistBoost: 0.12,
  },
  marsh: {
    id: 'marsh',
    name: 'Gloom Marsh',
    nameZh: '陰濕沼澤',
    hint: '高難度區。紫霧很濃，掉落也比較甜。',
    map: MARSH,
    spawn: { x: 7, y: 7 },
    portalTo: 'mistwood',
    portalSpawn: { x: 13, y: 5 },
    mistBoost: 0.2,
  },
}

export const ZONE_ORDER: ZoneId[] = ['mistwood', 'ruins', 'marsh']

export function findPortalTarget(zone: ZoneDef, pos: Vec): { to: ZoneId; spawn: Vec } | null {
  const tile = zone.map[pos.y]?.[pos.x]
  if (tile !== 5) return null

  // Ruins has two portals: left -> mistwood, right/top -> marsh
  if (zone.id === 'ruins') {
    if (pos.x <= 2) {
      return { to: 'mistwood', spawn: { x: 13, y: 5 } }
    }
    return { to: 'marsh', spawn: zone.portalSpawn }
  }

  if (zone.id === 'marsh') {
    if (pos.y <= 2) {
      return { to: 'ruins', spawn: { x: 13, y: 1 } }
    }
    return { to: 'mistwood', spawn: ZONES.mistwood.spawn }
  }

  return { to: zone.portalTo, spawn: zone.portalSpawn }
}
